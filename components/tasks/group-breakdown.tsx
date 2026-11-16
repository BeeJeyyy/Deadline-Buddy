import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GroupBreakdownItem } from "@/lib/my-tasks";

/** Side panel: how my tasks are spread across groups. */
export function GroupBreakdown({ items }: { items: GroupBreakdownItem[] }) {
  return (
    <Card className="gap-4 rounded-2xl py-5 shadow-none xl:sticky xl:top-6">
      <CardHeader className="px-5">
        <CardTitle className="text-base font-bold">By group</CardTitle>
        <CardDescription>Your tasks in each group</CardDescription>
      </CardHeader>

      <CardContent className="space-y-1 px-3">
        {items.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">You’re not in any groups yet.</p>
        ) : (
          items.map(({ group, total, done, open, overdue, percent }) => (
            <Link
              key={group.id}
              href={`/dashboard/groups/${group.id}`}
              className="block space-y-2 rounded-xl p-2 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{group.name}</span>
                {overdue > 0 && <Badge className="shrink-0 rounded-full">{overdue} overdue</Badge>}
              </div>
              <Progress value={percent} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {total === 0 ? "No tasks assigned to you" : `${done} of ${total} done · ${open} open`}
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}