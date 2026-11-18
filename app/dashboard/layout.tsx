import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Someone opened an invite link while signed out and has just signed in: finish joining the group.
  const pendingInvite = (await cookies()).get("pending_invite")?.value;
  if (pendingInvite) redirect(`/join/${encodeURIComponent(pendingInvite)}/accept`);

  const { user, groups, tasks, preferences } = await getDashboardData();
  const myTasks = tasks.filter((t) => t.assigneeId === user.id);
  const myTaskCount = myTasks.filter((t) => !t.completed).length;

  return (
    <SidebarProvider>
      <AppSidebar
        user={user}
        groups={groups}
        myTaskCount={myTaskCount}
        myTasks={myTasks}
        nowIso={new Date().toISOString()}
        weekStartsOn={preferences.weekStartsOn}
        showCalendar={preferences.showSidebarCalendar}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}