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
    <header className="flex h-[70px] items-center justify-between border-b px-7">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-bold tracking-tight">
          {greeting}, {firstName}
        </h1>
      </div>
      <Button onClick={onNewGroup} className="rounded-lg">
        <Plus /> New group
      </Button>
    </header>
  );
}