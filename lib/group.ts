import { getTaskStatus } from "@/lib/dashboard";
import type { Task, TaskPriority, TaskStatus } from "@/types";

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const isTaskStatus = (value: string): value is TaskStatus =>
  TASK_STATUSES.some((s) => s.value === value);

export const isTaskPriority = (value: string): value is TaskPriority =>
  TASK_PRIORITIES.some((p) => p.value === value);

export const getStatusLabel = (status: TaskStatus) =>
  TASK_STATUSES.find((s) => s.value === status)?.label ?? status;

/** The status one column to the left (-1) or right (1), or null at the edges. */
export function getAdjacentStatus(status: TaskStatus, direction: -1 | 1): TaskStatus | null {
  const index = TASK_STATUSES.findIndex((s) => s.value === status);
  return TASK_STATUSES[index + direction]?.value ?? null;
}

/** Earliest deadline first; tasks without a deadline go last. ISO dates sort as strings. */
export const byDueDate = (a: Task, b: Task) => {
  if (a.dueDate === b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
};

export function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const columns: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const task of [...tasks].sort(byDueDate)) columns[task.status].push(task);
  return columns;
}

/** List view: overdue work first, then everything still open, then finished tasks. */
export function getListSections(tasks: Task[], now: Date) {
  const sorted = [...tasks].sort(byDueDate);
  return {
    overdue: sorted.filter((t) => getTaskStatus(t, now) === "overdue"),
    upcoming: sorted.filter((t) => !t.completed && getTaskStatus(t, now) !== "overdue"),
    done: sorted.filter((t) => t.completed),
  };
}

export function getProgress(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  return { done, total, percent: total ? (done / total) * 100 : 0 };
}

export const getMemberProgress = (tasks: Task[], userId: string) =>
  getProgress(tasks.filter((t) => t.assigneeId === userId));