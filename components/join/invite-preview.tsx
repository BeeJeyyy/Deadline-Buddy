"use client";

import { useMemo, useState } from "react";
import { Check, MousePointerClick } from "lucide-react";

import { BoardView } from "@/components/groups/board-view";
import { ListView } from "@/components/groups/list-view";
import { MemberAvatar } from "@/components/groups/member-avatar";
import { ProgressSummary } from "@/components/groups/progress-summary";
import { TeamView } from "@/components/groups/team-view";
import { ViewSwitcher, type GroupViewKey } from "@/components/groups/view-switcher";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProgress } from "@/lib/group";
import type { Task, TaskPriority, TaskStatus, User } from "@/types";
import { GoogleButton } from "./google-button";

/** What the get_invite_preview SQL function returns. */
export interface InvitePreviewData {
  group: { id: string; name: string };
  members: { id: string; name: string }[];
  tasks: {
    id: string;
    title: string;
    assigneeId: string | null;
    dueDate: string | null;
    status: TaskStatus;
    priority: TaskPriority;
  }[];
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("") || "?";

const noop = () => {};
// A signed-out visitor can't add or move anything.
const cannotMove = () => false;

/**
 * What a signed-out visitor sees when they open an invite link: the group's board, read-only.
 * Clicking anything in the board asks them to sign in with Google.
 */
export function InvitePreview({ code, preview }: { code: string; preview: InvitePreviewData }) {
  const [signInOpen, setSignInOpen] = useState(false);
  const [view, setView] = useState<GroupViewKey>("board");
  const [now] = useState(() => new Date());

  const members: User[] = useMemo(
    () => preview.members.map((m) => ({ id: m.id, name: m.name, email: "", initials: initialsOf(m.name) })),
    [preview.members],
  );
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const tasks: Task[] = useMemo(
    () => preview.tasks.map((t) => ({ ...t, groupId: preview.group.id, completed: t.status === "done" })),
    [preview],
  );
  const progress = getProgress(tasks);

  return (
    <div className="min-h-svh bg-background">
      <header className="flex h-[70px] items-center justify-between gap-3 border-b px-4 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Check className="size-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Deadline Buddy</span>
        </div>
        <GoogleButton code={code} label="Join with Google" />
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-7">
        <section className="flex flex-col gap-4 rounded-2xl border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-sm text-muted-foreground">You’ve been invited to</p>
            <h1 className="truncate text-2xl font-bold tracking-tight">{preview.group.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex -space-x-2">
                {members.slice(0, 6).map((member) => (
                  <MemberAvatar key={member.id} user={member} className="ring-2 ring-background" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {members.length} {members.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
          <GoogleButton code={code} label="Sign in with Google to join" />
        </section>

        <div className="space-y-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MousePointerClick className="size-4" />
            This is a preview. Browse the tabs, and click anything else to sign in and join the group.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <ViewSwitcher value={view} onChange={setView} />
            <ProgressSummary {...progress} />
          </div>

          {/* Capturing the click here means nothing inside the views actually runs; it just asks to sign in. */}
          <div
            role="group"
            aria-label={`Preview of ${preview.group.name}`}
            className="cursor-pointer select-none"
            onClickCapture={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSignInOpen(true);
            }}
          >
            {view === "board" && (
              <BoardView
                tasks={tasks}
                membersById={membersById}
                now={now}
                showCompleted
                onAdd={noop}
                onMove={noop}
                canAdd={false}
                canMoveTask={cannotMove}
                canEdit={false}
                onEdit={noop}
              />
            )}
            {view === "list" && (
              <ListView
                tasks={tasks}
                membersById={membersById}
                now={now}
                showCompleted
                onSetStatus={noop}
                onNewTask={noop}
                canAdd={false}
                canMoveTask={cannotMove}
                canEdit={false}
                onEdit={noop}
              />
            )}
            {view === "team" && (
              <TeamView
                groupId={preview.group.id}
                // Neither id matches a real user, so no owner-only controls (remove member, delete group) show.
                ownerId="preview-owner"
                currentUserId="preview-visitor"
                members={members}
                tasks={tasks}
                onInvite={noop}
                onMemberRemoved={noop}
              />
            )}
          </div>
        </div>
      </main>

      {/* Outside the clickable board on purpose, so clicks inside the dialog aren't intercepted. */}
      <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Join {preview.group.name}</DialogTitle>
            <DialogDescription>
              Sign in with Google to join this group, see your tasks and keep track of deadlines together.
            </DialogDescription>
          </DialogHeader>
          <GoogleButton code={code} label="Continue with Google" fullWidth />
        </DialogContent>
      </Dialog>
    </div>
  );
}