import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { TASK_STATUSES, groupByStatus } from "@/lib/group";
import type { Task, TaskStatus, User } from "@/types";
import { BoardColumn } from "./board-column";

interface BoardViewProps {
  tasks: Task[];
  membersById: Map<string, User>;
  now: Date;
  /** When false the Done column is hidden (Settings → Show completed tasks). */
  showCompleted: boolean;
  onAdd: (status: TaskStatus) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  /** Only the admin sees the add buttons. */
  canAdd: boolean;
  /** Admin: every task. Member: only tasks assigned to them. */
  canMoveTask: (task: Task) => boolean;
  canEdit: boolean;
  onEdit: (task: Task) => void;
}

export function BoardView({
  tasks,
  membersById,
  now,
  showCompleted,
  onAdd,
  onMove,
  canAdd,
  canMoveTask,
  canEdit,
  onEdit,
}: BoardViewProps) {
  const columns = useMemo(() => groupByStatus(tasks), [tasks]);
  const statuses = showCompleted ? TASK_STATUSES : TASK_STATUSES.filter((s) => s.value !== "done");

  return (
    <div
      role="tabpanel"
      className={cn("grid items-start gap-4", showCompleted ? "md:grid-cols-3" : "md:grid-cols-2")}
    >
      {statuses.map(({ value, label }) => (
        <BoardColumn
          key={value}
          status={value}
          label={label}
          tasks={columns[value]}
          membersById={membersById}
          now={now}
          onAdd={onAdd}
          onMove={onMove}
          canAdd={canAdd}
          canMoveTask={canMoveTask}
          canEdit={canEdit}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}