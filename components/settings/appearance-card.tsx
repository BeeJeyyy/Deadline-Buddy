"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";

import { SegmentedControl } from "@/components/shared/segmented-control";
import { SettingsCard } from "./settings-card";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

type ThemeValue = (typeof THEMES)[number]["value"];

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();

  // The saved theme is only known in the browser; wait for it to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <SettingsCard title="Appearance" description="Choose how Deadline Buddy looks on this device.">
      <SegmentedControl
        kind="options"
        label="Theme"
        options={THEMES}
        value={(mounted ? (theme as ThemeValue) : undefined) ?? "system"}
        onChange={setTheme}
      />
    </SettingsCard>
  );
}