"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function toggleTaskCompleted(taskId: string, completed: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: completed ? "done" : "todo" })
    .eq("id", taskId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleGroupStar(groupId: string, starred: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("group_members")
    .update({ starred })
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export type CreateGroupResult = { ok: true; groupId: string } | { ok: false; error: string };

const MAX_GROUP_NAME_LENGTH = 60;

export async function createGroup(rawName: string): Promise<CreateGroupResult> {
  const name = rawName.trim();
  if (!name) return { ok: false, error: "Enter a group name." };
  if (name.length > MAX_GROUP_NAME_LENGTH) {
    return { ok: false, error: `Use ${MAX_GROUP_NAME_LENGTH} characters or fewer.` };
  }

  const supabase = await createClient();

  // created_by defaults to auth.uid(); a database trigger adds the creator as the first member.
  const { data, error } = await supabase.from("groups").insert({ name }).select("id").single();
  if (error) return { ok: false, error: "Couldn’t create the group. Try again." };

  revalidatePath("/dashboard", "layout"); // refresh the sidebar's group list too
  return { ok: true, groupId: data.id };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/"); // point this at your login route
}