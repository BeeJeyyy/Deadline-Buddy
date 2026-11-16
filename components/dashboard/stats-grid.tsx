import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

const STAT_LABELS: { key: keyof DashboardStats; label: string }[] = [
  { key: "openTasks", label: "Open tasks" },
  { key: "dueThisWeek", label: "Due this week" },
  { key: "overdue", label: "Overdue" },
  { key: "groups", label: "Groups" },
];

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STAT_LABELS.map(({ key, label }) => (
        <Card key={key} className="gap-1 rounded-xl py-4 shadow-none">
          <CardContent className="px-5">
            <p className="text-3xl font-bold tabular-nums">{stats[key]}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}