"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteGroup, removeMember } from "@/app/dashboard/groups/actions";
import { Button } from "@/components/ui/button";
import { getMemberProgress } from "@/lib/group";
import type { Task, User } from "@/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MemberCard } from "./member-card";

interface TeamViewProps {
  groupId: string;
  ownerId: string;
  currentUserId: string;
  members: User[];
  tasks: Task[];
  onInvite: () => void;
  onMemberRemoved: (userId: string) => void;
}

export function TeamView({
  groupId,
  ownerId,
  currentUserId,
  members,
  tasks,
  onInvite,
  onMemberRemoved,
}: TeamViewProps) {
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isOwner = currentUserId === ownerId;

  // You first, then everyone else alphabetically.
  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) =>
        a.id === currentUserId ? -1 : b.id === currentUserId ? 1 : a.name.localeCompare(b.name),
      ),
    [members, currentUserId],
  );

  const confirmRemove = () => {
    if (!memberToRemove) return;
    const member = memberToRemove;

    startTransition(async () => {
      const result = await removeMember(groupId, member.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onMemberRemoved(member.id);
      toast.success(`${member.name} was removed`);
      setMemberToRemove(null);
    });
  };

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteGroup(groupId); // redirects to the dashboard on success
      if (!result.ok) toast.error(result.error);
    });
  };

  return (
    <div role="tabpanel" className="space-y-6">
      <section aria-labelledby="members-heading" className="space-y-3">
        <h2 id="members-heading" className="text-sm font-semibold text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"}
        </h2>

        {/* One card per row on phones, two on tablets, three once there is room (xl). */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sortedMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              progress={getMemberProgress(tasks, member.id)}
              isYou={member.id === currentUserId}
              isOwner={member.id === ownerId}
              onRemove={isOwner && member.id !== currentUserId ? () => setMemberToRemove(member) : undefined}
            />
          ))}

          <button
            type="button"
            onClick={onInvite}
            className="flex min-h-[84px] items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-left font-semibold transition-colors hover:bg-muted/50 sm:justify-start sm:gap-3"
          >
            <Plus className="size-5" /> Invite a groupmate
          </button>
        </div>
      </section>

      {isOwner && (
        <section
          aria-labelledby="danger-heading"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <div className="min-w-0 space-y-0.5">
            <h2 id="danger-heading" className="font-semibold">
              Delete this group
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanently deletes the group and all of its tasks for everyone.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto sm:shrink-0"
            onClick={() => setDeleteOpen(true)}
          >
            Delete group
          </Button>
        </section>
      )}

      <ConfirmDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title={`Remove ${memberToRemove?.name ?? "member"}?`}
        description="They'll lose access to this group. Their tasks will become unassigned."
        confirmLabel="Remove"
        pending={isPending}
        onConfirm={confirmRemove}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this group?"
        description="All tasks in this group will be permanently deleted for everyone. This can't be undone."
        confirmLabel="Delete group"
        pending={isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}