import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface UserAvatarProps {
  user: Pick<User, "initials" | "avatarUrl">;
  /** Size and extras, e.g. "size-11". */
  className?: string;
  /** Extras for the initials shown when there is no photo, e.g. "text-xs". */
  fallbackClassName?: string;
  title?: string;
}

/** The person's Google photo, or their initials when they have none (or the photo can't load). */
export function UserAvatar({ user, className, fallbackClassName, title }: UserAvatarProps) {
  return (
    <Avatar className={className} title={title}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className={cn("bg-primary font-semibold text-primary-foreground", fallbackClassName)}>
        {user.initials}
      </AvatarFallback>
    </Avatar>
  );
}