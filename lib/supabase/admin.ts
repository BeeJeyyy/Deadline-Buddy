import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * A Supabase client that bypasses row level security. Server only: never import it from a client
 * component, and never expose the service role key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}