"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isPushConfigured, sendPush } from "@/lib/push/send";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type TestResult = { ok: true; sent: number } | { ok: false; error: string };

/** The part of the browser's PushSubscription (subscription.toJSON()) that we need. */
export interface BrowserSubscription {
  endpoint?: string;
  keys?: Record<string, string>;
}

const fail = (error: string) => ({ ok: false as const, error });

function validTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return timezone;
  } catch {
    return "UTC";
  }
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Saves this device so reminders can be sent to it, and remembers the user's timezone. */
export async function savePushSubscription(
  subscription: BrowserSubscription,
  timezone: string,
  userAgent: string,
): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return fail("Please sign in again.");

  const { endpoint, keys } = subscription;
  if (!endpoint?.startsWith("https://") || !keys?.p256dh || !keys?.auth) {
    return fail("This browser sent an incomplete subscription. Try again.");
  }
  if (!isPushConfigured()) return fail("Push notifications aren’t set up on the server yet.");

  // The service role is used so a device that was used by another account can be handed over to this one.
  // The user id comes from the verified session above, never from the browser.
  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent.slice(0, 300),
    },
    { onConflict: "endpoint" },
  );
  if (error) return fail("Couldn’t save this device. Try again.");

  await supabase.from("profiles").update({ timezone: validTimezone(timezone) }).eq("id", user.id);
  return { ok: true };
}

/** Turns notifications off for one device. */
export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  const { supabase, user } = await getUser();
  if (!user) return fail("Please sign in again.");

  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
  if (error) return fail("Couldn’t turn notifications off. Try again.");
  return { ok: true };
}

/** Sends a sample notification to every device the user turned notifications on for. */
export async function sendTestNotification(): Promise<TestResult> {
  const { supabase, user } = await getUser();
  if (!user) return fail("Please sign in again.");
  if (!isPushConfigured()) return fail("Push notifications aren’t set up on the server yet.");

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);
  if (error) return fail("Couldn’t load your devices.");
  if (!subscriptions?.length) return fail("No device is subscribed yet. Turn notifications on first.");

  let sent = 0;
  const gone: string[] = [];
  for (const subscription of subscriptions) {
    const outcome = await sendPush(subscription, {
      title: "Deadline Buddy",
      body: "Notifications are working. You’ll get your deadlines here.",
      url: "/dashboard/tasks",
      tag: "test",
    });
    if (outcome === "sent") sent += 1;
    if (outcome === "gone") gone.push(subscription.endpoint);
  }

  if (gone.length > 0) await supabase.from("push_subscriptions").delete().in("endpoint", gone);
  if (sent === 0) return fail("The notification couldn’t be delivered. Turn it off and on again.");
  return { ok: true, sent };
}