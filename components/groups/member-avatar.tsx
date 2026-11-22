import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

/** The member's photo (or initials); a dashed "?" circle when the task has no assignee. */
export function MemberAvatar({ user, className }: { user?: User | null; className?: string }) {
  if (!user) {
    return (
      <Avatar className={cn("size-6", className)} title="Unassigned">
        <AvatarFallback className="border border-dashed bg-transparent text-[10px] font-semibold text-muted-foreground">
          ?
        </AvatarFallback>
      </Avatar>
    );
  }

  return <UserAvatar user={user} title={user.name} className={cn("size-6", className)} fallbackClassName="text-[10px]" />;
}