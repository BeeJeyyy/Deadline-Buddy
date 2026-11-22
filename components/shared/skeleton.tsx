import { cn } from "@/lib/utils";

/** A pulsing grey placeholder shown while real content loads. Size it with className. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden="true" data-slot="skeleton" className={cn("animate-pulse rounded-lg bg-muted", className)} {...props} />;
}