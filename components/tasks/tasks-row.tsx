import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DueBadge } from "@/components/shared/due-badge";
import { cn } from "@/lib/utils";
import type { Group, Task } from "@/types";

interface TaskRowProps {
  task: Task;
  group?: Group;
  now: Date;
  onToggle: (taskId: string) => void;
}

export function TaskRow({ task, group, now, onToggle }: TaskRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        aria-label={`Mark “${task.title}” as ${task.completed ? "not done" : "done"}`}
        className="size-5 rounded-full"
      />

      <div className="min-w-0 flex-1 leading-tight">
        <p className={cn("truncate font-medium", task.completed && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        {group && (
          <Link
            href={`/dashboard/groups/${group.id}`}
            className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {group.name}
          </Link>
        )}
      </div>

      {task.priority === "high" && !task.completed && (
        <Badge variant="outline" className="rounded-full">
          High
        </Badge>
      )}
      <DueBadge task={task} now={now} />
    </div>
  );
}