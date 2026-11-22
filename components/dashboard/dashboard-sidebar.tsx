import { getDashboardData } from "@/lib/data/dashboard";
import { AppSidebar } from "./app-sidebar";

/**
 * Loads the data the sidebar needs, then renders it. The layout wraps this in <Suspense> so the page
 * frame appears immediately (with SidebarSkeleton) instead of waiting for the database.
 */
export async function DashboardSidebar() {
  const { user, groups, tasks, preferences } = await getDashboardData();
  const myTasks = tasks.filter((t) => t.assigneeId === user.id);
  const myTaskCount = myTasks.filter((t) => !t.completed).length;

  return (
    <AppSidebar
      user={user}
      groups={groups}
      myTaskCount={myTaskCount}
      myTasks={myTasks}
      nowIso={new Date().toISOString()}
      weekStartsOn={preferences.weekStartsOn}
      showCalendar={preferences.showSidebarCalendar}
    />
  );
}