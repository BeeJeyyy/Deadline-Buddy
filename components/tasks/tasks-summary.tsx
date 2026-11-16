import { Card, CardContent } from "@/components/ui/card";

interface TasksSummaryProps {
  summary: { open: number; overdue: number; dueThisWeek: number; completed: number };
}

const ITEMS = [
  { key: "open", label: "Open tasks" },
  { key: "overdue", label: "Overdue" },
  { key: "dueThisWeek", label: "Due this week" },
  { key: "completed", label: "Completed" },
] as const;

export function TasksSummary({ summary }: TasksSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ITEMS.map(({ key, label }) => (
        <Card key={key} className="gap-1 rounded-xl py-4 shadow-none">
          <CardContent className="px-5">
            <p className="text-3xl font-bold tabular-nums">{summary[key]}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}