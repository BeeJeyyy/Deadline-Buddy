"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/app/dashboard/groups/actions";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TASK_PRIORITIES } from "@/lib/group";
import type { Task, TaskPriority, User } from "@/types";

interface EditTaskDialogProps {
  /** The task being edited; the dialog is open while this is set. */
  task: Task | null;
  members: User[];
  currentUserId: string;
  onClose: () => void;
  /** Called after the server saved, so the page can show the new values. */
  onSaved: (taskId: string, changes: Pick<Task, "title" | "assigneeId" | "priority" | "dueDate">) => void;
}

/**
 * Owner-only form for changing a task's title, assignee, priority and due date.
 * Mount it with `key={task?.id}` so the fields start from the task each time it opens.
 */
export function EditTaskDialog({ task, members, currentUserId, onClose, onSaved }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!task) return;
    if (!title.trim()) {
      setError("Enter a task title.");
      return;
    }
    setError(null);

    const changes = {
      title: title.trim(),
      assigneeId: assigneeId || null,
      priority,
      dueDate: dueDate || null,
    };

    startTransition(async () => {
      const result = await updateTask(task.id, changes);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved(task.id, changes);
      toast.success("Task updated");
      onClose();
    });
  };

  return (
    <Dialog open={task !== null} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent showCloseButton={false} className="rounded-2xl sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit task</DialogTitle>
            <DialogDescription>Change the details of this task. Only you, the group owner, can do this.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-task-title">Title</Label>
            <Input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              autoComplete="off"
              autoFocus
              disabled={isPending}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "edit-task-error" : undefined}
              className="h-11 rounded-xl"
            />
            {error && (
              <p id="edit-task-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-task-assignee">Assignee</Label>
              <NativeSelect
                id="edit-task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={isPending}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                    {member.id === currentUserId ? " (you)" : ""}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-priority">Priority</Label>
              <NativeSelect
                id="edit-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={isPending}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-task-due">Due date (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isPending}
                className="h-11 flex-1 rounded-xl"
              />
              {dueDate && (
                <Button type="button" variant="ghost" onClick={() => setDueDate("")} disabled={isPending}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}