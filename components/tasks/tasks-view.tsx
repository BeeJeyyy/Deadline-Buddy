"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleTaskCompleted } from "@/app/dashboard/actions";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { useNow } from "@/hooks/use-now";
import {
  filterTasks,
  getGroupBreakdown,
  getMySummary,
  getTabCounts,
  getTaskSections,
  type TasksTab,
} from "@/lib/my-tasks";
import type { Group, Task } from "@/types";
import { GroupBreakdown } from "./group-breakdown";
import { TaskList } from "./tasks-list";
import { TasksSummary } from "./tasks-summary";
import { TasksToolbar } from "./tasks-toolbar";

interface TasksViewProps {
  groups: Group[];
  /** Only tasks assigned to the signed-in user. */
  initialTasks: Task[];
  nowIso: string;
}

const EMPTY_MESSAGES: Record<TasksTab, string> = {
  open: "You’re all caught up. No open tasks assigned to you.",
  overdue: "Nothing overdue. Nice work!",
  completed: "Tasks you finish will show up here.",
};

export function TasksView({ groups, initialTasks, nowIso }: TasksViewProps) {
  const now = useNow(nowIso);
  const [tasks, setTasks] = useState(initialTasks);
  const [tab, setTab] = useState<TasksTab>("open");
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("");
  const [, startTransition] = useTransition();

  const groupsById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  // Summary and "By group" always cover everything; the tabs follow the search and group filter.
  const summary = useMemo(() => getMySummary(tasks, now), [tasks, now]);
  const breakdown = useMemo(() => getGroupBreakdown(tasks, groups, now), [tasks, groups, now]);

  const filtered = useMemo(
    () => filterTasks(tasks, { query, groupId }, groupsById),
    [tasks, query, groupId, groupsById],
  );
  const counts = useMemo(() => getTabCounts(filtered, now), [filtered, now]);
  const sections = useMemo(() => getTaskSections(tab, filtered, now), [tab, filtered, now]);

  const tabs = [
    { value: "open", label: "Open", count: counts.open },
    { value: "overdue", label: "Overdue", count: counts.overdue },
    { value: "completed", label: "Completed", count: counts.completed },
  ] as const;

  const isFiltering = query.trim() !== "" || groupId !== "";

  // Instant update, saved in the background; the exact previous task is restored if saving fails.
  const toggleTask = (id: string) => {
    const previous = tasks.find((t) => t.id === id);
    if (!previous) return;

    const completed = !previous.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed, status: completed ? "done" : "todo" } : t)),
    );

    startTransition(async () => {
      const result = await toggleTaskCompleted(id, completed);
      if (!result.ok) {
        setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)));
        toast.error("Couldn’t update the task. Try again.");
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-5 sm:p-6 lg:p-7">
      <TasksSummary summary={summary} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl label="Task filters" options={tabs} value={tab} onChange={setTab} />
            <TasksToolbar
              query={query}
              onQueryChange={setQuery}
              groupId={groupId}
              onGroupChange={setGroupId}
              groups={groups}
            />
          </div>

          <TaskList
            sections={sections}
            groupsById={groupsById}
            now={now}
            emptyMessage={isFiltering ? "No tasks match your search or group filter." : EMPTY_MESSAGES[tab]}
            onToggle={toggleTask}
          />
        </section>

        <GroupBreakdown items={breakdown} />
      </div>
    </div>
  );
}