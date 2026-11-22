"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ResetInviteResult = { ok: true; inviteCode: string } | { ok: false; error: string };

/**
 * Gives the group a new invite code, so the old link stops working. Only the group owner may do this;
 * the database function checks it, so it can't be skipped.
 */
export async function resetInviteCode(groupId: string): Promise<ResetInviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const { data, error } = await supabase.rpc("reset_invite_code", { gid: groupId });
  if (error || typeof data !== "string") {
    const notOwner = error?.message.includes("Only the group owner");
    return { ok: false, error: notOwner ? "Only the group owner can reset the invite link." : "Couldn’t reset the link. Try again." };
  }

  revalidatePath(`/dashboard/groups/${groupId}`);
  return { ok: true, inviteCode: data };
}