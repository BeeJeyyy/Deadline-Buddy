"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleGroupStar, toggleTaskCompleted } from "@/app/dashboard/actions";
import { computeStats, getGreeting, getMyOpenTasks, summarizeGroup } from "@/lib/dashboard";
import type { Group, Task, User } from "@/types";
import { DashboardHeader } from "./dashboard-header";
import { DueSoon } from "./due-soon";
import { GroupsSection } from "./group-section";
import { NewGroupDialog } from "./new-group-dialog";
import { ReminderBanner } from "./reminder-banner";
import { StatsGrid } from "./stats-grid";

interface DashboardViewProps {
  user: User;
  users: User[];
  initialGroups: Group[];
  initialTasks: Task[];
  /** From Settings → Deadline reminders. */
  showReminders: boolean;
  /** Server timestamp, used for the first render so server and client markup match. */
  nowIso: string;
}

export function DashboardView({
  user,
  users,
  initialGroups,
  initialTasks,
  showReminders,
  nowIso,
}: DashboardViewProps) {
  const [now, setNow] = useState(() => new Date(nowIso));
  const [groups, setGroups] = useState(initialGroups);
  const [tasks, setTasks] = useState(initialTasks);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [, startTransition] = useTransition();

  // After hydration, switch to the visitor's local clock so the greeting and
  // overdue checks use their timezone rather than the server's.
  useEffect(() => setNow(new Date()), []);

  const stats = useMemo(() => computeStats(tasks, groups, user.id, now), [tasks, groups, user.id, now]);
  const summaries = useMemo(
    () => groups.map((g) => summarizeGroup(g, tasks, users, now)),
    [groups, tasks, users, now],
  );
  const dueSoon = useMemo(() => getMyOpenTasks(tasks, user.id), [tasks, user.id]);

  // Optimistic update first, then persist; roll back if Supabase rejects the change.
  const toggleStar = (id: string) => {
    const next = !groups.find((g) => g.id === id)?.starred;
    const apply = (starred: boolean) =>
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, starred } : g)));

    apply(next);
    startTransition(async () => {
      const result = await toggleGroupStar(id, next);
      if (!result.ok) {
        apply(!next);
        toast.error("Couldn’t update favorite. Try again.");
      }
    });
  };

  const addGroup = ({ id, name }: { id: string; name: string }) =>
    setGroups((prev) => [...prev, { id, name, memberIds: [user.id], starred: false }]);

  const toggleTask = (id: string) => {
    const next = !tasks.find((t) => t.id === id)?.completed;
    const apply = (completed: boolean) =>
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed, status: completed ? "done" : "todo" } : t,
        ),
      );

    apply(next);
    startTransition(async () => {
      const result = await toggleTaskCompleted(id, next);
      if (!result.ok) {
        apply(!next);
        toast.error("Couldn’t update task. Try again.");
      }
    });
  };

  return (
    <>
      <DashboardHeader
        greeting={getGreeting(now)}
        firstName={user.name.split(" ")[0]}
        onNewGroup={() => setNewGroupOpen(true)}
      />

      <div className="mx-auto w-full max-w-6xl space-y-4 p-7">
        {showReminders && <ReminderBanner stats={stats} />}
        <StatsGrid stats={stats} />

        <div className="grid gap-8 pt-4 lg:grid-cols-[1fr_340px]">
          <GroupsSection summaries={summaries} onToggleStar={toggleStar} />
          <DueSoon tasks={dueSoon} groups={groups} now={now} onToggleTask={toggleTask} />
        </div>
      </div>

      <NewGroupDialog open={newGroupOpen} onOpenChange={setNewGroupOpen} onCreated={addGroup} />
    </>
  );
}