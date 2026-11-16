import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Finishes an invite after the visitor signed in: joins the group, clears the "pending invite"
 * cookie, then opens the group. Sent here by app/dashboard/layout.tsx.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { origin } = new URL(request.url);
  const invitePage = `${origin}/join/${encodeURIComponent(code)}`;

  (await cookies()).delete("pending_invite");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = invitePage;
  if (user) {
    const { data: groupId } = await supabase.rpc("join_group", { code });
    if (groupId) destination = `${origin}/dashboard/groups/${groupId}`;
  }

  const response = NextResponse.redirect(destination);
  response.cookies.delete("pending_invite");
  return response;
}