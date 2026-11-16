"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteGroup, removeMember } from "@/app/dashboard/groups/actions";
import { Button } from "@/components/ui/button";
import { getMemberProgress } from "@/lib/group";
import type { Task, User } from "@/types";
import { ConfirmDialog } from "./confirm-dialog";
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
    <div role="tabpanel" className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
          className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-left font-semibold transition-colors hover:bg-muted/50"
        >
          <Plus className="size-5" /> Invite a groupmate
        </button>
      </div>

      {isOwner && (
        <Button variant="outline" onClick={() => setDeleteOpen(true)}>
          Delete this group
        </Button>
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