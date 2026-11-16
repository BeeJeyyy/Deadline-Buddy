import { Card } from "@/components/ui/card";
import type { TaskSection } from "@/lib/my-tasks";
import type { Group } from "@/types";
import { TaskRow } from "./tasks-row";

interface TaskListProps {
  sections: TaskSection[];
  groupsById: Map<string, Group>;
  now: Date;
  emptyMessage: string;
  onToggle: (taskId: string) => void;
}

export function TaskList({ sections, groupsById, now, emptyMessage, onToggle }: TaskListProps) {
  const visible = sections.filter((section) => section.tasks.length > 0);

  if (visible.length === 0) {
    return (
      <div role="tabpanel" className="rounded-2xl border border-dashed py-14 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div role="tabpanel" className="space-y-6">
      {visible.map((section) => (
        <section key={section.key} className="space-y-2">
          {section.title && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title} · {section.tasks.length}
            </h2>
          )}
          <Card className="gap-0 divide-y rounded-xl py-0 shadow-none">
            {section.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                group={groupsById.get(task.groupId)}
                now={now}
                onToggle={onToggle}
              />
            ))}
          </Card>
        </section>
      ))}
    </div>
  );
}