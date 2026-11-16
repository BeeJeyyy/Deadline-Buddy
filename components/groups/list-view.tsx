import { useMemo } from "react";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getListSections } from "@/lib/group";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus, User } from "@/types";
import { DueBadge } from "@/components/shared/due-badge";
import { MemberAvatar } from "./member-avatar";

interface ListViewProps {
  tasks: Task[];
  membersById: Map<string, User>;
  now: Date;
  onSetStatus: (taskId: string, status: TaskStatus) => void;
  showCompleted: boolean;
  onNewTask: () => void;
  canAdd: boolean;
  canMoveTask: (task: Task) => boolean;
  canEdit: boolean;
  onEdit: (task: Task) => void;
}

export function ListView({
  tasks,
  membersById,
  now,
  showCompleted,
  onSetStatus,
  onNewTask,
  canAdd,
  canMoveTask,
  canEdit,
  onEdit,
}: ListViewProps) {
  const sections = useMemo(() => getListSections(tasks, now), [tasks, now]);

  if (tasks.length === 0) {
    return (
      <div role="tabpanel" className="space-y-3 rounded-2xl border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {canAdd ? "No tasks yet. Add the first one to get started." : "No tasks yet. Your group admin will assign tasks to you."}
        </p>
        {canAdd && <Button onClick={onNewTask}>New task</Button>}
      </div>
    );
  }

  const rowProps = { membersById, now, onSetStatus, canMoveTask, canEdit, onEdit };

  return (
    <div role="tabpanel" className="space-y-6">
      <ListSection title="Overdue" tasks={sections.overdue} {...rowProps} />
      <ListSection title="Upcoming" tasks={sections.upcoming} {...rowProps} />
      {showCompleted && <ListSection title="Done" tasks={sections.done} {...rowProps} />}
    </div>
  );
}

interface ListSectionProps
  extends Pick<ListViewProps, "membersById" | "now" | "onSetStatus" | "canMoveTask" | "canEdit" | "onEdit"> {
  title: string;
  tasks: Task[];
}

function ListSection({ title, tasks, membersById, now, onSetStatus, canMoveTask, canEdit, onEdit }: ListSectionProps) {
  if (tasks.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title} · {tasks.length}
      </h2>

      <Card className="gap-0 divide-y rounded-xl py-0 shadow-none">
        {tasks.map((task) => (
          <div key={task.id} className="group flex items-center gap-3 px-4 py-3">
            <Checkbox
              checked={task.completed}
              disabled={!canMoveTask(task)}
              onCheckedChange={(checked) => onSetStatus(task.id, checked ? "done" : "todo")}
              aria-label={`Mark “${task.title}” as ${task.completed ? "not done" : "done"}`}
              className="size-5 rounded-full"
            />
            <span className={cn("flex-1 truncate", task.completed && "text-muted-foreground line-through")}>
              {task.title}
            </span>
            <DueBadge task={task} now={now} />
            <MemberAvatar user={task.assigneeId ? membersById.get(task.assigneeId) : undefined} />
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
                aria-label={`Edit “${task.title}”`}
                onClick={() => onEdit(task)}
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </Card>
    </section>
  );
}