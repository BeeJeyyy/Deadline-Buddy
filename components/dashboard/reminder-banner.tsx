import { Bell } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DashboardStats } from "@/types";

export function ReminderBanner({ stats }: { stats: Pick<DashboardStats, "overdue" | "dueThisWeek"> }) {
  const parts = [
    stats.overdue > 0 && `${stats.overdue} overdue`,
    stats.dueThisWeek > 0 && `${stats.dueThisWeek} due this week`,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <Alert className="rounded-xl border-foreground bg-background">
      <Bell />
      <AlertDescription className="text-foreground">
        <strong className="font-semibold">Reminder:</strong> {parts.join(", ")}.
      </AlertDescription>
    </Alert>
  );
}