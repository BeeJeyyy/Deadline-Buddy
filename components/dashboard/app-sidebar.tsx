"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, LayoutGrid, LogOut, Plus, SlidersHorizontal, SquareCheckBig } from "lucide-react";

import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/app/dashboard/actions";
import { LinkPending } from "@/components/dashboard/link-pending";
import { NewGroupDialog } from "@/components/dashboard/new-group-dialog";
import { SidebarCalendar } from "@/components/dashboard/sidebar-calendar";
import type { Group, Task, User, WeekStart } from "@/types";

interface AppSidebarProps {
  user: User;
  groups: Group[];
  myTaskCount: number;
  /** Tasks assigned to the signed-in user; they fill the deadline calendar. */
  myTasks: Task[];
  nowIso: string;
  /** From Settings → Week starts on. 0 = Sunday, 1 = Monday. */
  weekStartsOn: WeekStart;
  /** From Settings → Show deadline calendar. */
  showCalendar: boolean;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "My tasks", href: "/dashboard/tasks", icon: SquareCheckBig },
  { label: "Settings", href: "/dashboard/settings", icon: SlidersHorizontal },
] as const;

/**
 * Highlight for the page you are on. It keys off aria-current (set on the link itself), so it works
 * whichever data-attribute convention your generated sidebar component uses.
 */
const ACTIVE_STYLES =
  "aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:hover:bg-primary aria-[current=page]:hover:text-primary-foreground";

/** "Dashboard" is only active on the dashboard itself; a group page highlights that group instead. */
function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

export function AppSidebar({ user, groups, myTaskCount, myTasks, nowIso, weekStartsOn, showCalendar }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();

  // On phones and tablets the sidebar is a drawer on top of the page. Close it the moment a link is
  // tapped so the page is visible straight away; the effect also covers links that open other ways.
  const closeDrawer = () => {
    if (isMobile) setOpenMobile(false);
  };
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  // While the New group dialog is open, the sidebar fades and blurs along with the rest of the page,
  // so the highlighted item doesn't compete with the dialog.
  const dim = newGroupOpen ? "pointer-events-none select-none opacity-50 blur-[3px]" : "";

  return (
    <Sidebar>
      <SidebarHeader className={`px-4 pt-5 transition-[filter,opacity] duration-200 ${dim}`}>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Check className="size-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Deadline Buddy</span>
        </div>
      </SidebarHeader>

      <SidebarContent className={`px-2 transition-[filter,opacity] duration-200 ${dim}`}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} aria-current={active ? "page" : undefined} onClick={closeDrawer} />}
                      isActive={active}
                      className={ACTIVE_STYLES + " h-10 rounded-lg font-medium"}
                    >
                      <Icon />
                      <span>{label}</span>
                      <LinkPending />
                    </SidebarMenuButton>
                    {label === "My tasks" && myTaskCount > 0 && (
                      <SidebarMenuBadge className={active ? "text-primary-foreground" : undefined}>
                        {myTaskCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">
            Groups
          </SidebarGroupLabel>
          <SidebarGroupAction aria-label="Create group" title="Create group" onClick={() => setNewGroupOpen(true)}>
            <Plus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((group) => {
                const href = `/dashboard/groups/${group.id}`;
                const active = pathname === href;
                return (
                  <SidebarMenuItem key={group.id}>
                    <SidebarMenuButton
                      render={<Link href={href} aria-current={active ? "page" : undefined} onClick={closeDrawer} />}
                      isActive={active}
                      className={ACTIVE_STYLES + " h-10 rounded-lg text-muted-foreground lg:h-9"}
                    >
                      <span className="min-w-0 flex-1 truncate">{group.name}</span>
                      <LinkPending />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* mt-auto parks the calendar at the bottom of the sidebar whenever there is room. */}
        {showCalendar && (
          <SidebarGroup className="mt-auto border-t pt-3">
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">Deadlines</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarCalendar
                tasks={myTasks}
                groups={groups}
                nowIso={nowIso}
                weekStartsOn={weekStartsOn}
                onNavigate={closeDrawer}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className={`p-4 transition-[filter,opacity] duration-200 ${dim}`}>
        <div className="flex items-center gap-3 border-t pt-4">
          <UserAvatar user={user} className="size-9" fallbackClassName="text-xs" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut />
            </Button>
          </form>
        </div>
      </SidebarFooter>

      {/* createGroup refreshes the layout, so the new group appears in the list above. */}
      <NewGroupDialog
        open={newGroupOpen}
        onOpenChange={setNewGroupOpen}
        onCreated={(group) => router.push(`/dashboard/groups/${group.id}`)}
      />
    </Sidebar>
  );
}