"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateDisplayName } from "@/app/dashboard/settings/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/types";
import { SettingsCard } from "./settings-card";

interface ProfileCardProps {
  user: User;
  avatarUrl: string | null;
  provider: string;
}

export function ProfileCard({ user, avatarUrl, provider }: ProfileCardProps) {
  const [savedName, setSavedName] = useState(user.name);
  const [name, setName] = useState(user.name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isGoogle = provider === "google";
  const isDirty = name.trim() !== savedName;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateDisplayName(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedName(name.trim());
      setName(name.trim());
      toast.success("Profile updated");
    });
  };

  return (
    <SettingsCard title="Profile">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />}
            <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            {isGoogle ? "Your photo comes from your Google account." : "Your initials are used as your avatar."}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="name"
              disabled={isPending}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "display-name-error" : undefined}
              className="h-11 rounded-xl"
            />
            {error && (
              <p id="display-name-error" role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} readOnly disabled className="h-11 rounded-xl" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {isGoogle ? "Signed in with Google. Your email can’t be changed here." : "Your email can’t be changed here."}
        </p>

        <Button type="submit" disabled={!isDirty || isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </SettingsCard>
  );
}