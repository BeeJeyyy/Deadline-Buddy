import Link from "next/link";
import { ChevronLeft, Link2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ReportButton } from "./report-button";

interface GroupHeaderProps {
  groupId: string;
  name: string;
  isAdmin: boolean;
  onInvite: () => void;
  onNewTask: () => void;
}

export function GroupHeader({ groupId, name, isAdmin, onInvite, onNewTask }: GroupHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-2 border-b bg-background/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:min-h-[70px] sm:gap-3 sm:px-7">
      <div className="flex min-w-0 items-center gap-1 sm:gap-3">
        <SidebarTrigger className="lg:hidden" />
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href="/dashboard" />}
          aria-label="Back to dashboard"
        >
          <ChevronLeft />
        </Button>
        <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">{name}</h1>
      </div>

      {/* On a phone the buttons shrink to icons so the group name still has room. */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ReportButton groupId={groupId} />
        <Button variant="outline" onClick={onInvite} aria-label="Invite groupmates" className="max-sm:size-10 max-sm:px-0">
          <Link2 />
          <span className="hidden sm:inline">Invite</span>
        </Button>
        <Button onClick={onNewTask} aria-label="New task" className="max-sm:size-10 max-sm:px-0">
          <Plus />
          <span className="hidden sm:inline">New task</span>
        </Button>
      </div>
    </header>
  );
}