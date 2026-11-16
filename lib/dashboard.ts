import type { DashboardStats, Group, GroupSummary, Task, User } from "@/types";

const DAY_MS = 86_400_000;

export type TaskStatus = "done" | "overdue" | "due-soon" | "upcoming" | "no-deadline";

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

/** Parse an ISO date (YYYY-MM-DD) as local midnight, avoiding UTC drift. */
const parseDate = (iso: string) => new Date(`${iso}T00:00:00`);

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function getGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function getTaskStatus(task: Task, now: Date): TaskStatus {
  if (task.completed) return "done";
  if (!task.dueDate) return "no-deadline";

  const today = startOfDay(now).getTime();
  const due = parseDate(task.dueDate).getTime();

  if (due < today) return "overdue";
  if (due - today < 7 * DAY_MS) return "due-soon";
  return "upcoming";
}

export function getDueLabel(task: Task): string {
  if (!task.dueDate) return "No deadline";
  return shortDate.format(parseDate(task.dueDate));
}

/** Open tasks assigned to the user, earliest deadline first. */
export function getMyOpenTasks(tasks: Task[], userId: string): Task[] {
  return tasks
    .filter((t) => t.assigneeId === userId && !t.completed)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime();
    });
}

export function computeStats(
  tasks: Task[],
  groups: Group[],
  userId: string,
  now: Date,
): DashboardStats {
  const mine = getMyOpenTasks(tasks, userId);
  const countBy = (status: TaskStatus) =>
    mine.filter((t) => getTaskStatus(t, now) === status).length;

  return {
    openTasks: mine.length,
    dueThisWeek: countBy("due-soon"),
    overdue: countBy("overdue"),
    groups: groups.length,
  };
}

export function summarizeGroup(
  group: Group,
  tasks: Task[],
  users: User[],
  now: Date,
): GroupSummary {
  const groupTasks = tasks.filter((t) => t.groupId === group.id);
  const doneTasks = groupTasks.filter((t) => t.completed).length;

  return {
    group,
    members: users.filter((u) => group.memberIds.includes(u.id)),
    totalTasks: groupTasks.length,
    doneTasks,
    progress: groupTasks.length ? (doneTasks / groupTasks.length) * 100 : 0,
    overdueTasks: groupTasks.filter((t) => getTaskStatus(t, now) === "overdue").length,
  };
}