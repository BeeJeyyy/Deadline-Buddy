"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { signOut } from "@/app/dashboard/actions";
import { deleteMyData } from "@/app/dashboard/settings/actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { SettingRow } from "./setting-row";
import { SettingsCard } from "./settings-card";

export function AccountCard({ provider }: { provider: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteMyData(); // redirects to the dashboard on success
      if (!result.ok) toast.error(result.error);
    });
  };

  const providerName = provider === "google" ? "Google" : "your email";

  return (
    <SettingsCard title="Account">
      <div className="divide-y">
        <SettingRow title="Sign out" description={`You can sign back in with ${providerName} anytime.`}>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              <LogOut /> Sign out
            </Button>
          </form>
        </SettingRow>

        <SettingRow
          title="Delete my groups and tasks"
          description="Deletes groups you created and removes you from groups you joined."
        >
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            Delete data
          </Button>
        </SettingRow>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete your groups and tasks?"
        description="Groups you created will be deleted for everyone, along with their tasks. You’ll leave groups you joined. Your account stays. This can’t be undone."
        confirmLabel="Delete data"
        pending={isPending}
        onConfirm={handleDelete}
      />
    </SettingsCard>
  );
}