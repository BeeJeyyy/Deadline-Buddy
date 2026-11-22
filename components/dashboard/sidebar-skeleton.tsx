import { Check, LayoutGrid, SlidersHorizontal, SquareCheckBig } from "lucide-react";

import { Skeleton } from "@/components/shared/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

const NAV = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "My tasks", icon: SquareCheckBig },
  { label: "Settings", icon: SlidersHorizontal },
];

/**
 * The sidebar while its data loads. It uses the real <Sidebar>, so it takes the same width and the
 * page doesn't jump when the real one replaces it. Only the parts that depend on data are placeholders.
 */
export function SidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Check className="size-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Deadline Buddy</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2" aria-busy="true">
        <SidebarGroup>
          <SidebarGroupContent className="space-y-1">
            {NAV.map(({ label, icon: Icon }) => (
              <div key={label} className="flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground">
                <Icon className="size-4" />
                {label}
              </div>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">Groups</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2 px-2 pt-1">
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-6 w-2/3" />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto border-t pt-3">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">Deadlines</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-3 px-1 pt-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-4 w-24" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 border-t pt-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}