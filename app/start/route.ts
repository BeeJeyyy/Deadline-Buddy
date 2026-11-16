import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Sends a signed-in user to the page they chose under Settings → "Open on startup".
 * Point your login redirect (auth/callback/route.ts) at /start instead of /dashboard.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/", request.url));

  const { data } = await supabase.from("profiles").select("start_page").eq("id", user.id).single();
  const path = data?.start_page === "tasks" ? "/dashboard/tasks" : "/dashboard";

  return NextResponse.redirect(new URL(path, request.url));
}