import { getTaskStatus } from "@/lib/dashboard";
import { byDueDate } from "@/lib/group";
import type { Group, Task } from "@/types";

export type TasksTab = "open" | "overdue" | "completed";

export interface TaskSection {
  key: string;
  title?: string;
  tasks: Task[];
}

export interface TaskFilters {
  query: string;
  /** Empty string means "all groups". */
  groupId: string;
}

export function filterTasks(tasks: Task[], filters: TaskFilters, groupsById: Map<string, Group>): Task[] {
  const query = filters.query.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.groupId && task.groupId !== filters.groupId) return false;
    if (!query) return true;
    const groupName = groupsById.get(task.groupId)?.name.toLowerCase() ?? "";
    return task.title.toLowerCase().includes(query) || groupName.includes(query);
  });
}

export function getTabCounts(tasks: Task[], now: Date): Record<TasksTab, number> {
  return {
    open: tasks.filter((t) => !t.completed).length,
    overdue: tasks.filter((t) => getTaskStatus(t, now) === "overdue").length,
    completed: tasks.filter((t) => t.completed).length,
  };
}

/** What each tab shows. "Open" is split so overdue work always comes first. */
export function getTaskSections(tab: TasksTab, tasks: Task[], now: Date): TaskSection[] {
  const sorted = [...tasks].sort(byDueDate);
  const overdue = sorted.filter((t) => getTaskStatus(t, now) === "overdue");

  if (tab === "overdue") return [{ key: "overdue", title: "Overdue", tasks: overdue }];
  if (tab === "completed") return [{ key: "completed", tasks: sorted.filter((t) => t.completed) }];

  return [
    { key: "overdue", title: "Overdue", tasks: overdue },
    {
      key: "upcoming",
      title: "Upcoming",
      tasks: sorted.filter((t) => !t.completed && getTaskStatus(t, now) !== "overdue"),
    },
  ];
}

export function getMySummary(tasks: Task[], now: Date) {
  const counts = getTabCounts(tasks, now);
  return {
    open: counts.open,
    overdue: counts.overdue,
    dueThisWeek: tasks.filter((t) => getTaskStatus(t, now) === "due-soon").length,
    completed: counts.completed,
  };
}

export interface GroupBreakdownItem {
  group: Group;
  total: number;
  done: number;
  open: number;
  overdue: number;
  percent: number;
}

/** My tasks per group, for the "By group" panel. */
export function getGroupBreakdown(tasks: Task[], groups: Group[], now: Date): GroupBreakdownItem[] {
  return groups.map((group) => {
    const mine = tasks.filter((t) => t.groupId === group.id);
    const done = mine.filter((t) => t.completed).length;
    return {
      group,
      total: mine.length,
      done,
      open: mine.length - done,
      overdue: mine.filter((t) => getTaskStatus(t, now) === "overdue").length,
      percent: mine.length ? (done / mine.length) * 100 : 0,
    };
  });
}