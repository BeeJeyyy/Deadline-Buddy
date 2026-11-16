import type { TaskPriority, TaskStatus } from "@/types";

export interface ReportMember {
  id: string;
  name: string;
}

export interface ReportTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO date (YYYY-MM-DD) or null. */
  dueDate: string | null;
  assigneeId: string | null;
  /** ISO timestamps. completedAt/completedById are null for tasks finished before tracking started. */
  createdAt: string;
  completedAt: string | null;
  completedById: string | null;
}

/** Everything the PDF needs, loaded fresh from the database when the button is pressed. */
export interface ReportData {
  group: { id: string; name: string };
  members: ReportMember[];
  tasks: ReportTask[];
  generatedBy: string;
}