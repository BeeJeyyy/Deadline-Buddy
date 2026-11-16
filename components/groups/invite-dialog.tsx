"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

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
  inviteCode: string;
}

export function InviteDialog({ open, onOpenChange, inviteCode }: InviteDialogProps) {
  // Only read inside the dialog, which renders on the client after it opens.
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/join/${inviteCode}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn’t copy. Select the link and copy it manually.");
    }
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
            className="h-11 rounded-xl"
          />
          <Button onClick={copy} className="h-11">
            <Copy /> Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}