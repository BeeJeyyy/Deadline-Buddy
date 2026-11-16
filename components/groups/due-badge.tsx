import { Badge } from "@/components/ui/badge";
import { getDueLabel, getTaskStatus } from "@/lib/dashboard";
import type { Task } from "@/types";

/** Black "Overdue · Nov 2" pill for late tasks, outlined date for everything else. */
export function DueBadge({ task, now }: { task: Task; now: Date }) {
  if (!task.dueDate) return null;

  const overdue = getTaskStatus(task, now) === "overdue";
  const label = getDueLabel(task);

  return (
    <Badge variant={overdue ? "default" : "outline"} className="rounded-full font-medium">
      {overdue ? `Overdue · ${label}` : label}
    </Badge>
  );
}