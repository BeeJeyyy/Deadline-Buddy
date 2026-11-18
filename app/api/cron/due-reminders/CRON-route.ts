import { NextResponse } from "next/server";

import { isPushConfigured, sendPush, type PushPayload } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // web-push needs Node, not the edge runtime

interface SubscriptionRow {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface ProfileRow {
  id: string;
  timezone: string;
  reminder_hour: number;
  notify_due_today: boolean;
  notify_due_tomorrow: boolean;
  notify_overdue: boolean;
  last_reminder_on: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  due_date: string;
  assignee_id: string;
  group: { name: string } | { name: string }[] | null;
}

/** The date (YYYY-MM-DD) and hour (0 to 23) right now in a timezone. */
function localTime(timeZone: string, now: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

function safeLocalTime(timeZone: string, now: Date) {
  try {
    return localTime(timeZone, now);
  } catch {
    return localTime("UTC", now);
  }
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

const groupName = (task: TaskRow) => (Array.isArray(task.group) ? task.group[0]?.name : task.group?.name);

/**
 * Sends each user one daily summary of their deadlines to the devices they turned notifications on for.
 * Call it every hour (see the setup notes): a user is notified once per day, the first time it runs
 * after their chosen reminder hour in their own timezone.
 *
 * Protected by CRON_SECRET: send the header  Authorization: Bearer <CRON_SECRET>
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push isn’t configured: set the VAPID keys." }, { status: 500 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: subscriptions, error: subscriptionError } = await admin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");
  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
  if (!subscriptions?.length) return NextResponse.json({ users: 0, notified: 0, devices: 0, removed: 0 });

  const devicesByUser = new Map<string, SubscriptionRow[]>();
  for (const row of subscriptions as SubscriptionRow[]) {
    devicesByUser.set(row.user_id, [...(devicesByUser.get(row.user_id) ?? []), row]);
  }

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, timezone, reminder_hour, notify_due_today, notify_due_tomorrow, notify_overdue, last_reminder_on")
    .in("id", [...devicesByUser.keys()]);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  // Who is due a reminder right now: past their reminder hour, and not already reminded today.
  const waiting = ((profiles ?? []) as ProfileRow[])
    .map((profile) => ({ profile, local: safeLocalTime(profile.timezone, now) }))
    .filter(({ profile, local }) => local.hour >= profile.reminder_hour && profile.last_reminder_on !== local.date);

  let notified = 0;
  let devices = 0;
  const goneEndpoints: string[] = [];

  if (waiting.length > 0) {
    const { data: tasks, error: taskError } = await admin
      .from("tasks")
      .select("id, title, due_date, assignee_id, group:groups(name)")
      .in("assignee_id", waiting.map(({ profile }) => profile.id))
      .neq("status", "done")
      .not("due_date", "is", null);
    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 });

    for (const { profile, local } of waiting) {
      const mine = ((tasks ?? []) as unknown as TaskRow[])
        .filter((task) => task.assignee_id === profile.id)
        .sort((a, b) => a.due_date.localeCompare(b.due_date));
      const tomorrow = addDays(local.date, 1);

      const overdue = profile.notify_overdue ? mine.filter((t) => t.due_date < local.date) : [];
      const dueToday = profile.notify_due_today ? mine.filter((t) => t.due_date === local.date) : [];
      const dueTomorrow = profile.notify_due_tomorrow ? mine.filter((t) => t.due_date === tomorrow) : [];

      const parts = [
        overdue.length > 0 && `${overdue.length} overdue`,
        dueToday.length > 0 && `${dueToday.length} due today`,
        dueTomorrow.length > 0 && `${dueTomorrow.length} due tomorrow`,
      ].filter(Boolean);
      if (parts.length === 0) continue; // nothing to say, so don't bother them

      const next = overdue[0] ?? dueToday[0] ?? dueTomorrow[0]!;
      const group = groupName(next);
      const payload: PushPayload = {
        title: "Your deadlines",
        body: `${parts.join(" · ")}\nNext: ${next.title}${group ? ` (${group})` : ""}`,
        url: "/dashboard/tasks",
        tag: "due-reminder",
      };

      let delivered = 0;
      for (const device of devicesByUser.get(profile.id) ?? []) {
        const outcome = await sendPush(device, payload);
        if (outcome === "sent") delivered += 1;
        if (outcome === "gone") goneEndpoints.push(device.endpoint);
      }

      if (delivered > 0) {
        notified += 1;
        devices += delivered;
        await admin.from("profiles").update({ last_reminder_on: local.date }).eq("id", profile.id);
      }
    }
  }

  if (goneEndpoints.length > 0) await admin.from("push_subscriptions").delete().in("endpoint", goneEndpoints);

  return NextResponse.json({ users: devicesByUser.size, notified, devices, removed: goneEndpoints.length });
}

export const GET = handle;
export const POST = handle;