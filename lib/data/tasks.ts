import type { Task, TaskPriority, TaskStatus } from "@/types";

/** Columns selected whenever tasks are read, so every query maps the same way. */
export const TASK_COLUMNS = "id, title, group_id, assignee_id, due_date, status, priority";

export interface TaskRow {
  id: string;
  title: string;
  group_id: string;
  assignee_id: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
}

export const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  groupId: row.group_id,
  assigneeId: row.assignee_id,
  dueDate: row.due_date,
  status: row.status,
  priority: row.priority,
  completed: row.status === "done",
});