import "server-only";

import { cache } from "react";

import { getDashboardData } from "@/lib/data/dashboard";
import { createClient } from "@/lib/supabase/server";
import type { Preferences, User } from "@/types";

export interface SettingsData {
  user: User;
  preferences: Preferences;
  avatarUrl: string | null;
  /** How the user signed in, e.g. "google" or "email". */
  provider: string;
}

export const getSettingsData = cache(async (): Promise<SettingsData> => {
  const { user, preferences } = await getDashboardData();

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const metadata = authUser?.user_metadata ?? {};
  const avatarUrl = (metadata.avatar_url ?? metadata.picture ?? null) as string | null;
  const provider = (authUser?.app_metadata?.provider ?? "email") as string;

  return { user, preferences, avatarUrl, provider };
});