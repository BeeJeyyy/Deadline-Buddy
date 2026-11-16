"use server";

import { createClient } from "@/lib/supabase/server";
import type { ReportData, ReportTask } from "@/lib/report/types";

type ReportResult = { ok: true; data: ReportData } | { ok: false; error: string };

interface Profile {
  full_name: string | null;
  email: string | null;
}

const displayName = (profile: Profile | null | undefined) =>
  profile?.full_name?.trim() || profile?.email?.split("@")[0] || "Member";

/** Loads fresh data for the group report. Row level security means only members can read a group. */
export async function getGroupReportData(groupId: string): Promise<ReportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const [groupRes, memberRes, taskRes, meRes] = await Promise.all([
    supabase.from("groups").select("id, name").eq("id", groupId).single(),
    supabase
      .from("group_members")
      .select("user_id, joined_at, profiles(full_name, email)")
      .eq("group_id", groupId)
      .order("joined_at"),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, assignee_id, created_at, completed_at, completed_by")
      .eq("group_id", groupId),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
  ]);

  if (groupRes.error || !groupRes.data) return { ok: false, error: "Group not found." };
  if (memberRes.error) return { ok: false, error: "Couldn’t load the members." };
  if (taskRes.error) return { ok: false, error: `Couldn’t load the tasks: ${taskRes.error.message}` };

  const members = (memberRes.data ?? []).map((row) => {
    // The embedded profile comes back as an object (or a one-item array, depending on the client version).
    const profile = (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) as Profile | null;
    return { id: row.user_id as string, name: displayName(profile) };
  });

  const tasks: ReportTask[] = (taskRes.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    completedById: row.completed_by,
  }));

  return {
    ok: true,
    data: {
      group: { id: groupRes.data.id, name: groupRes.data.name },
      members,
      tasks,
      generatedBy: displayName(meRes.data as Profile | null),
    },
  };
}