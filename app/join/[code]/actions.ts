"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Must be the same callback your normal login button uses (and be in Supabase's redirect URL list). */
const AUTH_CALLBACK_PATH = "/auth/callback";

/**
 * Starts Google sign-in for someone who opened an invite link while signed out.
 * The invite code is kept in a short-lived cookie; after they sign in, the dashboard sends them
 * to /join/<code>/accept, which adds them to the group.
 */
export async function signInWithGoogleForInvite(code: string) {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const origin = headerList.get("origin") ?? `${protocol}://${host}`;

  (await cookies()).set("pending_invite", code, {
    path: "/",
    maxAge: 60 * 60, // one hour is plenty to finish signing in
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}${AUTH_CALLBACK_PATH}` },
  });

  if (error || !data.url) redirect(`/join/${encodeURIComponent(code)}`);
  redirect(data.url);
}