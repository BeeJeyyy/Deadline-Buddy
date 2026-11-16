import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdjacentStatus, getStatusLabel } from "@/lib/group";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus, User } from "@/types";
import { DueBadge } from "@/components/shared/due-badge";
import { MemberAvatar } from "./member-avatar";

interface TaskCardProps {
  task: Task;
  assignee?: User;
  now: Date;
  onMove: (status: TaskStatus) => void;
  /** True for the admin, or for the member this task is assigned to. */
  canMove: boolean;
  /** True for the group owner, who can edit the task details. */
  canEdit: boolean;
  onEdit: () => void;
}

export function TaskCard({ task, assignee, now, onMove, canMove, canEdit, onEdit }: TaskCardProps) {
  const previous = getAdjacentStatus(task.status, -1);
  const next = getAdjacentStatus(task.status, 1);
  const done = task.status === "done";

  return (
    <Card className="group gap-2.5 rounded-xl px-3.5 py-3 shadow-none">
      <div className="flex items-start justify-between gap-2">
        <p className={cn("min-w-0 flex-1 break-words text-sm font-medium leading-snug", done && "text-muted-foreground line-through")}>
          {task.title}
        </p>

        {/* Edit and move buttons: visible on hover/focus, always visible on touch screens */}
        <div className="-mr-1.5 -mt-1 flex shrink-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
          {canEdit && (
            <Button variant="ghost" size="icon" className="size-6" aria-label="Edit task" onClick={onEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
          {canMove && previous && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label={`Move to ${getStatusLabel(previous)}`}
              onClick={() => onMove(previous)}
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          {canMove && next && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label={`Move to ${getStatusLabel(next)}`}
              onClick={() => onMove(next)}
            >
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <DueBadge task={task} now={now} />
          {task.priority === "high" && !done && (
            <Badge variant="outline" className="rounded-full">
              High
            </Badge>
          )}
        </div>
        <MemberAvatar user={assignee} />
      </div>
    </Card>
  );
}