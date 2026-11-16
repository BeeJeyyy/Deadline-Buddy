"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTaskStatus } from "@/app/dashboard/groups/actions";
import type { Task, TaskStatus } from "@/types";

/** Local task state for the group page: instant updates, saved in the background, rolled back on failure. */
export function useGroupTasks(initialTasks: Task[]) {
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();

  const patch = (id: string, changes: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));

  const setStatus = (id: string, status: TaskStatus) => {
    const previous = tasks.find((t) => t.id === id);
    if (!previous || previous.status === status) return;

    patch(id, { status, completed: status === "done" });
    startTransition(async () => {
      const result = await updateTaskStatus(id, status);
      if (!result.ok) {
        patch(id, { status: previous.status, completed: previous.completed });
        toast.error("Couldn’t update the task. Try again.");
      }
    });
  };

  /** Applies changes the server has already saved (used by the Edit task dialog). */
  const applyEdit = (id: string, changes: Partial<Task>) => patch(id, changes);

  const addTask = (task: Task) => setTasks((prev) => [...prev, task]);

  const unassignMember = (userId: string) =>
    setTasks((prev) => prev.map((t) => (t.assigneeId === userId ? { ...t, assigneeId: null } : t)));

  return { tasks, setStatus, applyEdit, addTask, unassignMember };
}