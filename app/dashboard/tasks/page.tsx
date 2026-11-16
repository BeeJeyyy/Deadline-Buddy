import { PageHeader } from "@/components/shared/page-header";
import { TasksView } from "@/components/tasks/tasks-view";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function TasksPage() {
  const { user, groups, tasks } = await getDashboardData();
  const myTasks = tasks.filter((task) => task.assigneeId === user.id);

  return (
    <>
      <PageHeader title="My tasks" />
      <TasksView groups={groups} initialTasks={myTasks} nowIso={new Date().toISOString()} />
    </>
  );
}