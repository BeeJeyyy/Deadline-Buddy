"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createGroup } from "@/app/dashboard/actions";
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

const MAX_NAME_LENGTH = 60;

interface NewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (group: { id: string; name: string }) => void;
}

export function NewGroupDialog({ open, onOpenChange, onCreated }: NewGroupDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setName("");
    setError(null);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (isPending) return; // don't dismiss while saving
    if (next) onOpenChange(true);
    else close();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a group name.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createGroup(trimmed);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated({ id: result.groupId, name: trimmed });
      toast.success(`“${trimmed}” created`);
      close();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-2xl sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New group</DialogTitle>
            <DialogDescription>
              Name your group project. You can invite groupmates next.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chemistry Lab Report"
              maxLength={MAX_NAME_LENGTH}
              autoComplete="off"
              autoFocus
              disabled={isPending}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "group-name-error" : undefined}
              className="h-11 rounded-xl"
            />
            {error && (
              <p id="group-name-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}