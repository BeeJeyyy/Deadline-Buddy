"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updatePreferences } from "@/app/dashboard/settings/actions";
import { NativeSelect } from "@/components/shared/native-select";
import { Switch } from "@/components/ui/switch";
import type { Preferences, StartPage, WeekStart } from "@/types";
import { SettingRow } from "./setting-row";
import { SettingsCard } from "./settings-card";

type Saveable = Pick<
  Preferences,
  "remindDeadlines" | "showCompleted" | "startPage" | "weekStartsOn" | "showSidebarCalendar"
>;

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

export function PreferencesCard({ initial }: { initial: Preferences }) {
  const [preferences, setPreferences] = useState<Saveable>(initial);
  const [, startTransition] = useTransition();

  // Update the screen first, save in the background, and undo if saving fails.
  const save = (changes: Partial<Saveable>) => {
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
    <SettingsCard title="Preferences" description="Changes save automatically.">
      <div className="space-y-6">
        <section aria-labelledby="pref-general" className="space-y-1">
          <SectionHeading id="pref-general">General</SectionHeading>
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

            <SettingRow
              stackOnMobile
              title="Open on startup"
              description="The first page you see after signing in."
            >
              <NativeSelect
                aria-label="Open on startup"
                value={preferences.startPage}
                onChange={(e) => save({ startPage: e.target.value as StartPage })}
                className="w-full sm:w-44"
              >
                <option value="dashboard">Dashboard</option>
                <option value="tasks">My tasks</option>
              </NativeSelect>
            </SettingRow>
          </div>
        </section>

        <section aria-labelledby="pref-calendar" className="space-y-1">
          <SectionHeading id="pref-calendar">Deadline calendar</SectionHeading>
          <div className="divide-y">
            <SettingRow
              title="Show calendar in the sidebar"
              description="A small month view with your due dates highlighted."
            >
              <Switch
                checked={preferences.showSidebarCalendar}
                onCheckedChange={(checked) => save({ showSidebarCalendar: checked })}
                aria-label="Show calendar in the sidebar"
              />
            </SettingRow>

            <SettingRow stackOnMobile title="Week starts on" description="The first day shown in the calendar.">
              <NativeSelect
                aria-label="Week starts on"
                value={preferences.weekStartsOn}
                onChange={(e) => save({ weekStartsOn: Number(e.target.value) as WeekStart })}
                className="w-full sm:w-44"
                disabled={!preferences.showSidebarCalendar}
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </NativeSelect>
            </SettingRow>
          </div>
        </section>
      </div>
    </SettingsCard>
  );
}