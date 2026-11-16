import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";

import { getDashboardData } from "@/lib/data/dashboard";
import { TASK_COLUMNS, toTask, type TaskRow } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/server";
import type { GroupInfo, Task, User } from "@/types";

export interface GroupDetail {
  group: GroupInfo;
  members: User[];
  tasks: Task[];
  currentUserId: string;
  showCompleted: boolean;
}

/** Everything the group page needs. Row level security guarantees members-only access. */
export const getGroupDetail = cache(async (groupId: string): Promise<GroupDetail> => {
  // Reuses the dashboard query (cached per request) to know who we are and who is in which group.
  const { user, users, groups, preferences } = await getDashboardData();
  const membership = groups.find((g) => g.id === groupId);
  if (!membership) notFound();

  const supabase = await createClient();
  const [groupRes, taskRes] = await Promise.all([
    supabase.from("groups").select("id, name, created_by, invite_code").eq("id", groupId).single(),
    supabase.from("tasks").select(TASK_COLUMNS).eq("group_id", groupId),
  ]);

  if (groupRes.error) notFound();
  if (taskRes.error) throw new Error(`Failed to load tasks: ${taskRes.error.message}`);

  return {
    group: {
      id: groupRes.data.id,
      name: groupRes.data.name,
      inviteCode: groupRes.data.invite_code,
      ownerId: groupRes.data.created_by,
    },
    members: users.filter((u) => membership.memberIds.includes(u.id)),
    tasks: ((taskRes.data ?? []) as unknown as TaskRow[]).map(toTask),
    currentUserId: user.id,
    showCompleted: preferences.showCompleted,
  };
});