import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { TASK_COLUMNS, toTask, type TaskRow } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/server";
import type { Group, Preferences, Task, User } from "@/types";

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string;
}

interface MembershipRow {
  starred: boolean;
  group: {
    id: string;
    name: string;
    members: { user: ProfileRow | null }[];
  } | null;
}

interface OwnProfileRow extends ProfileRow {
  remind_deadlines: boolean;
  show_completed: boolean;
  start_page: string;
  week_starts_on: number;
  show_sidebar_calendar: boolean;
  notify_due_today: boolean;
  notify_due_tomorrow: boolean;
  notify_overdue: boolean;
  reminder_hour: number;
}

export interface DashboardData {
  user: User;
  preferences: Preferences;
  users: User[];
  groups: Group[];
  tasks: Task[];
}

function toUser(profile: ProfileRow): User {
  const name = profile.full_name?.trim() || profile.email.split("@")[0];
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return { id: profile.id, name, email: profile.email, initials };
}

/**
 * Loads everything the dashboard needs in one place.
 * Wrapped in `cache` so the layout and the page share a single round trip per request.
 * Row level security (see supabase/schema.sql) limits results to the signed-in user's groups.
 */
export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/"); // point this at your login route

  const [profileRes, membershipRes, taskRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, remind_deadlines, show_completed, start_page, week_starts_on, show_sidebar_calendar, notify_due_today, notify_due_tomorrow, notify_overdue, reminder_hour",
      )
      .eq("id", authUser.id)
      .single(),
    supabase
      .from("group_members")
      .select(
        "starred, group:groups(id, name, members:group_members(user:profiles(id, full_name, email)))",
      )
      .eq("user_id", authUser.id),
    supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .order("due_date", { ascending: true, nullsFirst: false }),
  ]);

  if (profileRes.error) throw new Error(`Failed to load profile: ${profileRes.error.message}`);
  if (membershipRes.error) throw new Error(`Failed to load groups: ${membershipRes.error.message}`);
  if (taskRes.error) throw new Error(`Failed to load tasks: ${taskRes.error.message}`);

  const profile = profileRes.data as OwnProfileRow;
  const user = toUser(profile);
  const preferences: Preferences = {
    remindDeadlines: profile.remind_deadlines,
    showCompleted: profile.show_completed,
    startPage: profile.start_page === "tasks" ? "tasks" : "dashboard",
    weekStartsOn: profile.week_starts_on === 1 ? 1 : 0,
    showSidebarCalendar: profile.show_sidebar_calendar,
    notifyDueToday: profile.notify_due_today,
    notifyDueTomorrow: profile.notify_due_tomorrow,
    notifyOverdue: profile.notify_overdue,
    reminderHour: profile.reminder_hour,
  };
  const usersById = new Map<string, User>([[user.id, user]]);
  const groups: Group[] = [];

  for (const row of (membershipRes.data ?? []) as unknown as MembershipRow[]) {
    if (!row.group) continue;

    const memberIds: string[] = [];
    for (const { user: profile } of row.group.members) {
      if (!profile) continue;
      memberIds.push(profile.id);
      if (!usersById.has(profile.id)) usersById.set(profile.id, toUser(profile));
    }

    groups.push({
      id: row.group.id,
      name: row.group.name,
      memberIds,
      starred: row.starred,
    });
  }

  const tasks: Task[] = ((taskRes.data ?? []) as unknown as TaskRow[]).map(toTask);

  return { user, preferences, users: [...usersById.values()], groups, tasks };
});