export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  starred: boolean;
}

export interface Task {
  id: string;
  title: string;
  groupId: string;
  assigneeId: string | null;
  /** ISO date, e.g. "2026-10-31". `null` means no deadline. */
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** Derived from `status === "done"`. */
  completed: boolean;
}

export interface DashboardStats {
  openTasks: number;
  dueThisWeek: number;
  overdue: number;
  groups: number;
}

export interface GroupSummary {
  group: Group;
  members: User[];
  totalTasks: number;
  doneTasks: number;
  /** 0–100 */
  progress: number;
  overdueTasks: number;
}

export interface GroupInfo {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
}

export type StartPage = "dashboard" | "tasks";

export interface Preferences {
  remindDeadlines: boolean;
  showCompleted: boolean;
  startPage: StartPage;
}