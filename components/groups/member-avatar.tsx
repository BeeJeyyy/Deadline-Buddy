import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

/** Initials avatar; a dashed "?" circle when the task has no assignee. */
export function MemberAvatar({ user, className }: { user?: User | null; className?: string }) {
  return (
    <Avatar className={cn("size-6", className)} title={user?.name ?? "Unassigned"}>
      <AvatarFallback
        className={cn(
          "text-[10px] font-semibold",
          user
            ? "bg-primary text-primary-foreground"
            : "border border-dashed bg-transparent text-muted-foreground",
        )}
      >
        {user?.initials ?? "?"}
      </AvatarFallback>
    </Avatar>
  );
}