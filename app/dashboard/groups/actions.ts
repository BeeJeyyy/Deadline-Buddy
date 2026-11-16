"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { TASK_COLUMNS, toTask, type TaskRow } from "@/lib/data/tasks";
import { isTaskPriority, isTaskStatus } from "@/lib/group";
import { createClient } from "@/lib/supabase/server";
import type { Task, TaskPriority, TaskStatus } from "@/types";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type CreateTaskResult = { ok: true; task: Task } | { ok: false; error: string };

export interface NewTaskInput {
  groupId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null; // YYYY-MM-DD
}

const MAX_TITLE_LENGTH = 120;
const fail = (error: string) => ({ ok: false as const, error });
const refresh = () => revalidatePath("/dashboard", "layout"); // also refreshes the sidebar

export async function createTask(input: NewTaskInput): Promise<CreateTaskResult> {
  const title = input.title.trim();
  if (!title) return fail("Enter a task title.");
  if (title.length > MAX_TITLE_LENGTH) return fail(`Use ${MAX_TITLE_LENGTH} characters or fewer.`);
  if (!isTaskStatus(input.status) || !isTaskPriority(input.priority)) return fail("Invalid task.");
  if (input.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) return fail("Invalid due date.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in again.");

  // Roles: only the group admin (the creator) hands out tasks.
  const { data: group } = await supabase.from("groups").select("created_by").eq("id", input.groupId).single();
  if (!group || group.created_by !== user.id) return fail("Only the group admin can add tasks.");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      group_id: input.groupId,
      title,
      status: input.status,
      priority: input.priority,
      assignee_id: input.assigneeId,
      due_date: input.dueDate,
    })
    .select(TASK_COLUMNS)
    .single();

  if (error) return fail("Couldn’t create the task. Try again.");
  refresh();
  return { ok: true, task: toTask(data as unknown as TaskRow) };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<ActionResult> {
  if (!isTaskStatus(status)) return fail("Invalid status.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in again.");

  // Roles: the admin can move any task; a member can only move the tasks assigned to them.
  const { data: task } = await supabase.from("tasks").select("group_id, assignee_id").eq("id", taskId).single();
  if (!task) return fail("Task not found.");
  if (task.assignee_id !== user.id) {
    const { data: group } = await supabase.from("groups").select("created_by").eq("id", task.group_id).single();
    if (!group || group.created_by !== user.id) return fail("Only the admin or the person assigned can move this task.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .select("id");

  if (error || !data?.length) return fail("Couldn’t update the task.");
  refresh();
  return { ok: true };
}

export interface TaskEdits {
  title: string;
  assigneeId: string | null;
  priority: TaskPriority;
  dueDate: string | null; // YYYY-MM-DD
}

/** Edits a task's title, assignee, priority and due date. Only the group owner (the admin) may do this. */
export async function updateTask(taskId: string, edits: TaskEdits): Promise<ActionResult> {
  const title = edits.title.trim();
  if (!title) return fail("Enter a task title.");
  if (title.length > MAX_TITLE_LENGTH) return fail(`Use ${MAX_TITLE_LENGTH} characters or fewer.`);
  if (!isTaskPriority(edits.priority)) return fail("Invalid priority.");
  if (edits.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(edits.dueDate)) return fail("Invalid due date.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in again.");

  const { data: task } = await supabase.from("tasks").select("group_id").eq("id", taskId).single();
  if (!task) return fail("Task not found.");

  const { data: group } = await supabase.from("groups").select("created_by").eq("id", task.group_id).single();
  if (!group || group.created_by !== user.id) return fail("Only the group owner can edit tasks.");

  // The assignee has to be someone who is actually in this group.
  if (edits.assigneeId) {
    const { data: member } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", task.group_id)
      .eq("user_id", edits.assigneeId)
      .maybeSingle();
    if (!member) return fail("That person isn’t in this group.");
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title,
      assignee_id: edits.assigneeId,
      priority: edits.priority,
      due_date: edits.dueDate,
    })
    .eq("id", taskId)
    .select("id");

  if (error || !data?.length) return fail("Couldn’t save the changes. Try again.");
  refresh();
  return { ok: true };
}

export async function removeMember(groupId: string, userId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Hand their tasks back to "unassigned" so nothing is left pointing at a non-member.
  await supabase.from("tasks").update({ assignee_id: null }).eq("group_id", groupId).eq("assignee_id", userId);

  // Row level security only lets the group owner delete other members' rows.
  const { data, error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select("user_id");

  if (error || !data?.length) return fail("You’re not allowed to remove this member.");
  refresh();
  return { ok: true };
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("groups").delete().eq("id", groupId).select("id");

  if (error || !data?.length) return fail("Only the group owner can delete this group.");
  refresh();
  redirect("/dashboard");
}