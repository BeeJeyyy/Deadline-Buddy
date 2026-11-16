import { X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { User } from "@/types";

interface MemberCardProps {
  member: User;
  progress: { done: number; total: number; percent: number };
  isYou: boolean;
  isOwner: boolean;
  onRemove?: () => void; // only passed when the viewer is allowed to remove this member
}

export function MemberCard({ member, progress, isYou, isOwner, onRemove }: MemberCardProps) {
  return (
    <Card className="flex-row items-center gap-4 rounded-xl p-4 shadow-none">
      <Avatar className="size-11">
        <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
          {member.initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-semibold">{member.name}</p>
          {isYou && (
            <Badge variant="outline" className="rounded-full font-normal">
              You
            </Badge>
          )}
          <Badge variant={isOwner ? "default" : "secondary"} className="rounded-full font-normal">
            {isOwner ? "Admin" : "Member"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {progress.total === 0
            ? "No tasks assigned"
            : `${progress.done} of ${progress.total} assigned tasks done`}
        </p>
        <Progress value={progress.percent} className="h-1.5" />
      </div>

      {onRemove && (
        <Button variant="ghost" size="icon" className="size-7" aria-label={`Remove ${member.name}`} onClick={onRemove}>
          <X className="size-4" />
        </Button>
      )}
    </Card>
  );
}