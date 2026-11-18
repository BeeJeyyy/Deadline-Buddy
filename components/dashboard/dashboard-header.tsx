import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardHeaderProps {
  greeting: string;
  firstName: string;
  onNewGroup?: () => void;
}

export function DashboardHeader({ greeting, firstName, onNewGroup }: DashboardHeaderProps) {
  return (
    // Sticks to the top while scrolling so the menu and "New group" are always one tap away on a phone.
    <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:min-h-[70px] sm:px-7">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* The sidebar is a slide-over drawer below the lg breakpoint, so the menu button shows there. */}
        <SidebarTrigger className="-ml-1 lg:hidden" />
        <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
          {greeting}, {firstName}
        </h1>
      </div>
      <Button onClick={onNewGroup} className="shrink-0 rounded-lg max-sm:size-10 max-sm:px-0" aria-label="New group">
        <Plus />
        <span className="hidden sm:inline">New group</span>
      </Button>
    </header>
  );
}