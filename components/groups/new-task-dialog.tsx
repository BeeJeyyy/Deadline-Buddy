"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createTask } from "@/app/dashboard/groups/actions";
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
import { TASK_PRIORITIES, getStatusLabel } from "@/lib/group";
import type { Task, TaskPriority, TaskStatus, User } from "@/types";
import { NativeSelect } from "./native-select";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  /** Column the task is being added to. */
  status: TaskStatus;
  members: User[];
  currentUserId: string;
  onCreated: (task: Task) => void;
}

export function NewTaskDialog({
  open,
  onOpenChange,
  groupId,
  status,
  members,
  currentUserId,
  onCreated,
}: NewTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState(currentUserId);
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setTitle("");
    setAssigneeId(currentUserId);
    setDueDate("");
    setPriority("medium");
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Enter a task title.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createTask({
        groupId,
        title,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated(result.task);
      toast.success("Task added");
      close();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && (next ? onOpenChange(true) : close())}>
      <DialogContent showCloseButton={false} className="rounded-2xl sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New task</DialogTitle>
            <DialogDescription>Adding to “{getStatusLabel(status)}”.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write the methods section"
              maxLength={120}
              autoComplete="off"
              autoFocus
              disabled={isPending}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "task-title-error" : undefined}
              className="h-11 rounded-xl"
            />
            {error && (
              <p id="task-title-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <NativeSelect id="task-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
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
              <Label htmlFor="task-priority">Priority</Label>
              <NativeSelect
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
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
            <Label htmlFor="task-due">Due date (optional)</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isPending}
              className="h-11 rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}