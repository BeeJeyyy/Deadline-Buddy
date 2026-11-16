import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getDueLabel, getTaskStatus } from "@/lib/dashboard";
import type { Group, Task } from "@/types";

interface DueSoonProps {
  tasks: Task[];
  groups: Group[];
  now: Date;
  onToggleTask: (taskId: string) => void;
}

export function DueSoon({ tasks, groups, now, onToggleTask }: DueSoonProps) {
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "";

  return (
    <section aria-labelledby="due-soon-heading" className="space-y-4">
      <h2 id="due-soon-heading" className="font-semibold">
        Due soon
      </h2>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">You’re all caught up.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const overdue = getTaskStatus(task, now) === "overdue";
            return (
              <li key={task.id}>
                <Card className="flex-row items-center gap-3 rounded-xl px-4 py-3 shadow-none">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => onToggleTask(task.id)}
                    aria-label={`Mark “${task.title}” as done`}
                    className="size-5 rounded-full"
                  />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {groupName(task.groupId)}
                    </p>
                  </div>
                  <Badge variant={overdue ? "default" : "outline"} className="shrink-0 rounded-full">
                    {overdue ? `Overdue · ${getDueLabel(task)}` : `Due ${getDueLabel(task)}`}
                  </Badge>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}