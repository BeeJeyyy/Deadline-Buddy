"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updatePreferences } from "@/app/dashboard/settings/actions";
import { NativeSelect } from "@/components/shared/native-select";
import { Switch } from "@/components/ui/switch";
import type { Preferences, StartPage } from "@/types";
import { SettingRow } from "./setting-row";
import { SettingsCard } from "./settings-card";

export function PreferencesCard({ initial }: { initial: Preferences }) {
  const [preferences, setPreferences] = useState(initial);
  const [, startTransition] = useTransition();

  // Update the screen first, save in the background, and undo if saving fails.
  const save = (changes: Partial<Preferences>) => {
    const previous = preferences;
    setPreferences({ ...preferences, ...changes });

    startTransition(async () => {
      const result = await updatePreferences(changes);
      if (!result.ok) {
        setPreferences(previous);
        toast.error("Couldn’t save your preference. Try again.");
      }
    });
  };

  return (
    <SettingsCard title="Preferences">
      <div className="divide-y">
        <SettingRow
          title="Deadline reminders"
          description="Show a reminder on your dashboard for overdue and upcoming tasks."
        >
          <Switch
            checked={preferences.remindDeadlines}
            onCheckedChange={(checked) => save({ remindDeadlines: checked })}
            aria-label="Deadline reminders"
          />
        </SettingRow>

        <SettingRow
          title="Show completed tasks"
          description="Keep the Done column and list visible in your groups."
        >
          <Switch
            checked={preferences.showCompleted}
            onCheckedChange={(checked) => save({ showCompleted: checked })}
            aria-label="Show completed tasks"
          />
        </SettingRow>

        <SettingRow title="Open on startup" description="The first page you see after signing in.">
          <NativeSelect
            aria-label="Open on startup"
            value={preferences.startPage}
            onChange={(e) => save({ startPage: e.target.value as StartPage })}
            className="w-44"
          >
            <option value="dashboard">Dashboard</option>
            <option value="tasks">My tasks</option>
          </NativeSelect>
        </SettingRow>
      </div>
    </SettingsCard>
  );
}