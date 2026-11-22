import Link from "next/link";
import { Star } from "lucide-react";

import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { GroupSummary } from "@/types";

interface GroupCardProps {
  summary: GroupSummary;
  onToggleStar: (groupId: string) => void;
}

export function GroupCard({ summary, onToggleStar }: GroupCardProps) {
  const { group, members, totalTasks, doneTasks, progress, overdueTasks } = summary;

  return (
    <Card className="relative rounded-xl shadow-none transition-colors hover:border-foreground/40">
      <CardContent className="space-y-3 px-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">
            {/* Stretched link: the whole card is clickable, the star button stays on top */}
            <Link href={`/dashboard/groups/${group.id}`} className="after:absolute after:inset-0">
              {group.name}
            </Link>
          </h3>
          <Button
            size="icon"
            variant={group.starred ? "default" : "ghost"}
            className="relative z-10 -mt-1 size-9 shrink-0 rounded-lg"
            aria-label={group.starred ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={group.starred}
            onClick={() => onToggleStar(group.id)}
          >
            <Star className={cn(group.starred && "fill-current")} />
          </Button>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {doneTasks} of {totalTasks} tasks done
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {members.map((member) => (
              <UserAvatar
                key={member.id}
                user={member}
                title={member.name}
                className="size-6 ring-2 ring-background"
                fallbackClassName="text-[10px]"
              />
            ))}
          </div>
          {overdueTasks > 0 ? (
            <Badge className="rounded-full">{overdueTasks} overdue</Badge>
          ) : (
            <Badge variant="outline" className="rounded-full font-normal">
              No deadlines
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}