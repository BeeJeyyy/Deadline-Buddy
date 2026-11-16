import Link from "next/link";
import { ChevronLeft, Link2, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ReportButton } from "./report-button";

interface GroupHeaderProps {
  groupId: string;
  name: string;
  /** The group creator. Only the admin can add tasks. */
  isAdmin: boolean;
  onInvite: () => void;
  onNewTask: () => void;
}

export function GroupHeader({ groupId, name, isAdmin, onInvite, onNewTask }: GroupHeaderProps) {
  return (
    <header className="flex h-[70px] items-center justify-between gap-3 border-b px-7">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href="/dashboard" />}
          aria-label="Back to dashboard"
        >
          <ChevronLeft />
        </Button>
        <h1 className="truncate text-xl font-bold tracking-tight">{name}</h1>
        <Badge variant={isAdmin ? "default" : "outline"} className="shrink-0 rounded-full font-normal">
          {isAdmin ? "Admin" : "Member"}
        </Badge>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ReportButton groupId={groupId} />
        <Button variant="outline" onClick={onInvite}>
          <Link2 /> Invite
        </Button>
        {isAdmin && (
          <Button onClick={onNewTask}>
            <Plus /> New task
          </Button>
        )}
      </div>
    </header>
  );
}