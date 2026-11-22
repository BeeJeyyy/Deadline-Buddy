"use client";

import { useMemo, useState } from "react";

import { useGroupTasks } from "@/hooks/use-group-tasks";
import { useNow } from "@/hooks/use-now";
import { getProgress } from "@/lib/group";
import type { GroupInfo, Task, TaskStatus, User } from "@/types";
import { BoardView } from "./board-view";
import { EditTaskDialog } from "./edit-task-dialog";
import { GroupHeader } from "./group-header";
import { InviteDialog } from "./invite-dialog";
import { ListView } from "./list-view";
import { NewTaskDialog } from "./new-task-dialog";
import { ProgressSummary } from "./progress-summary";
import { TeamView } from "./team-view";
import { ViewSwitcher, type GroupViewKey } from "./view-switcher";

interface GroupViewProps {
  group: GroupInfo;
  members: User[];
  initialTasks: Task[];
  currentUserId: string;
  /** From Settings → Show completed tasks. */
  showCompleted: boolean;
  nowIso: string;
}

/** Owns the page state (tab, dialogs, tasks) and hands plain props to the views. */
export function GroupView({
  group,
  members,
  initialTasks,
  currentUserId,
  showCompleted,
  nowIso,
}: GroupViewProps) {
  const now = useNow(nowIso);
  const { tasks, setStatus, applyEdit, addTask, unassignMember } = useGroupTasks(initialTasks);
  // The group owner is the admin. Admin: adds tasks, edits their details, moves every task.
  // Member: can only move the tasks assigned to them.
  const isAdmin = currentUserId === group.ownerId;
  const canEdit = isAdmin;
  const canMoveTask = (task: Task) => isAdmin || task.assigneeId === currentUserId;

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [view, setView] = useState<GroupViewKey>("board");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newTask, setNewTask] = useState<{ open: boolean; status: TaskStatus }>({
    open: false,
    status: "todo",
  });

  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const progress = useMemo(() => getProgress(tasks), [tasks]);

  const openNewTask = (status: TaskStatus = "todo") => setNewTask({ open: true, status });

  return (
    <>
      <GroupHeader
        groupId={group.id}
        name={group.name}
        isAdmin={isAdmin}
        onInvite={() => setInviteOpen(true)}
        onNewTask={() => openNewTask()}
      />

      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:p-6 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ViewSwitcher value={view} onChange={setView} />
          <ProgressSummary {...progress} />
        </div>

        {view === "board" && (
          <BoardView
            tasks={tasks}
            membersById={membersById}
            now={now}
            showCompleted={showCompleted}
            onAdd={openNewTask}
            onMove={setStatus}
            canAdd={isAdmin}
            canMoveTask={canMoveTask}
            canEdit={canEdit}
            onEdit={setEditingTask}
          />
        )}
        {view === "list" && (
          <ListView
            tasks={tasks}
            membersById={membersById}
            now={now}
            showCompleted={showCompleted}
            onSetStatus={setStatus}
            onNewTask={() => openNewTask()}
            canAdd={isAdmin}
            canMoveTask={canMoveTask}
            canEdit={canEdit}
            onEdit={setEditingTask}
          />
        )}
        {view === "team" && (
          <TeamView
            groupId={group.id}
            ownerId={group.ownerId}
            currentUserId={currentUserId}
            members={members}
            tasks={tasks}
            onInvite={() => setInviteOpen(true)}
            onMemberRemoved={unassignMember}
          />
        )}
      </div>

      <NewTaskDialog
        open={newTask.open}
        onOpenChange={(open) => setNewTask((prev) => ({ ...prev, open }))}
        groupId={group.id}
        status={newTask.status}
        members={members}
        currentUserId={currentUserId}
        onCreated={addTask}
      />
      {canEdit && (
        <EditTaskDialog
          key={editingTask?.id ?? "none"}
          task={editingTask}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setEditingTask(null)}
          onSaved={applyEdit}
        />
      )}
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} groupId={group.id} inviteCode={group.inviteCode} isAdmin={isAdmin} />
    </>
  );
}