"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { resetInviteCode } from "@/app/dashboard/groups/invite-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  inviteCode: string;
  /** Only the group admin (owner) can reset the link. */
  isAdmin: boolean;
}

export function InviteDialog({ open, onOpenChange, groupId, inviteCode, isAdmin }: InviteDialogProps) {
  // Starts from the saved code and switches to the new one the moment a reset succeeds.
  const [code, setCode] = useState(inviteCode);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setCode(inviteCode), [inviteCode]);
  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  // Only read inside the dialog, which renders on the client after it opens.
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/join/${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn’t copy. Select the link and copy it manually.");
    }
  };

  const reset = () => {
    startTransition(async () => {
      const result = await resetInviteCode(groupId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCode(result.inviteCode);
      setConfirming(false);
      toast.success("New invite link created. The old one no longer works.");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Invite groupmates</DialogTitle>
          <DialogDescription>
            Share this link. Anyone who opens it while signed in will join the group.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            readOnly
            value={link}
            aria-label="Invite link"
            onFocus={(event) => event.currentTarget.select()}
            className="h-11 min-w-0 rounded-xl"
          />
          <Button onClick={copy} className="h-11 shrink-0">
            <Copy /> Copy
          </Button>
        </div>

        {isAdmin && (
          <section aria-labelledby="reset-invite-heading" className="space-y-3 rounded-xl border p-4">
            <div className="space-y-1">
              <h3 id="reset-invite-heading" className="text-sm font-semibold">
                Reset invite link
              </h3>
              <p className="text-sm text-muted-foreground">
                {confirming
                  ? "The old link will stop working right away. People who already joined stay in the group, and you'll get a new link to share."
                  : "Did the link reach the wrong people? Make a new one. Only you, the group owner, can do this."}
              </p>
            </div>

            {confirming ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setConfirming(false)} disabled={isPending} className="sm:flex-1">
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  disabled={isPending}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-1"
                >
                  <RefreshCw className={isPending ? "animate-spin" : undefined} />
                  {isPending ? "Resetting…" : "Yes, reset the link"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setConfirming(true)} className="w-full sm:w-auto">
                <RefreshCw /> Reset link
              </Button>
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}