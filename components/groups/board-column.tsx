import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Task, TaskStatus, User } from "@/types";
import { StatusIcon } from "./status-icon";
import { TaskCard } from "./task-card";

interface BoardColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  membersById: Map<string, User>;
  now: Date;
  onAdd: (status: TaskStatus) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  canAdd: boolean;
  canMoveTask: (task: Task) => boolean;
  canEdit: boolean;
  onEdit: (task: Task) => void;
}

export function BoardColumn({
  status,
  label,
  tasks,
  membersById,
  now,
  onAdd,
  onMove,
  canAdd,
  canMoveTask,
  canEdit,
  onEdit,
}: BoardColumnProps) {
  return (
    <section aria-label={label} className="flex flex-col gap-3 rounded-2xl border p-3">
      <header className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <StatusIcon status={status} />
          {label}
          <span className="font-normal text-muted-foreground">{tasks.length}</span>
        </h2>
        {canAdd && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Add task to ${label}`}
            onClick={() => onAdd(status)}
          >
            <Plus />
          </Button>
        )}
      </header>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed py-6 text-center text-xs text-muted-foreground">
          Nothing here yet
        </p>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            assignee={task.assigneeId ? membersById.get(task.assigneeId) : undefined}
            now={now}
            onMove={(next) => onMove(task.id, next)}
            canMove={canMoveTask(task)}
            canEdit={canEdit}
            onEdit={() => onEdit(task)}
          />
        ))
      )}
    </section>
  );
}