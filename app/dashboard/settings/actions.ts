"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Preferences } from "@/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_NAME_LENGTH = 60;
const fail = (error: string) => ({ ok: false as const, error });
const refresh = () => revalidatePath("/dashboard", "layout");

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export async function updateDisplayName(rawName: string): Promise<ActionResult> {
  const fullName = rawName.trim();
  if (!fullName) return fail("Enter a display name.");
  if (fullName.length > MAX_NAME_LENGTH) return fail(`Use ${MAX_NAME_LENGTH} characters or fewer.`);

  const { supabase, userId } = await getUserId();
  if (!userId) return fail("Not signed in.");

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId)
    .select("id");

  if (error || !data?.length) return fail("Couldn’t save your name. Try again.");
  refresh(); // updates the name in the sidebar too
  return { ok: true };
}

export async function updatePreferences(changes: Partial<Preferences>): Promise<ActionResult> {
  const columns: Record<string, boolean | string> = {};

  if (typeof changes.remindDeadlines === "boolean") columns.remind_deadlines = changes.remindDeadlines;
  if (typeof changes.showCompleted === "boolean") columns.show_completed = changes.showCompleted;
  if (changes.startPage !== undefined) {
    if (changes.startPage !== "dashboard" && changes.startPage !== "tasks") return fail("Invalid page.");
    columns.start_page = changes.startPage;
  }
  if (Object.keys(columns).length === 0) return fail("Nothing to save.");

  const { supabase, userId } = await getUserId();
  if (!userId) return fail("Not signed in.");

  const { data, error } = await supabase.from("profiles").update(columns).eq("id", userId).select("id");
  if (error || !data?.length) return fail("Couldn’t save your preferences.");

  refresh();
  return { ok: true };
}

/**
 * Deletes the groups you created (their tasks go with them) and removes you from groups you joined.
 * Your account and profile stay.
 */
export async function deleteMyData(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return fail("Not signed in.");

  // Order matters: unassign while we're still a member, then leave.
  const owned = await supabase.from("groups").delete().eq("created_by", userId);
  if (owned.error) return fail("Couldn’t delete your groups. Try again.");

  const unassigned = await supabase.from("tasks").update({ assignee_id: null }).eq("assignee_id", userId);
  if (unassigned.error) return fail("Couldn’t update your tasks. Try again.");

  const left = await supabase.from("group_members").delete().eq("user_id", userId);
  if (left.error) return fail("Couldn’t remove you from your groups. Try again.");

  refresh();
  redirect("/dashboard");
}