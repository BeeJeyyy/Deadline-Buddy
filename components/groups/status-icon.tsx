import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

/** Empty circle = to do, half-filled = in progress, filled = done. */
export function StatusIcon({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("size-4 shrink-0", className)} aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="6"
        fill={status === "done" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      />
      {status === "in_progress" && <path d="M8 2a6 6 0 0 0 0 12z" fill="currentColor" />}
    </svg>
  );
}