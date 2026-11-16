import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function DashboardPage() {
  const { user, users, groups, tasks, preferences } = await getDashboardData();

  return (
    <DashboardView
      user={user}
      users={users}
      initialGroups={groups}
      initialTasks={tasks}
      showReminders={preferences.remindDeadlines}
      nowIso={new Date().toISOString()}
    />
  );
}