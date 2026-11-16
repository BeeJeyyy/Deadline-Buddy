import { Progress } from "@/components/ui/progress";

interface ProgressSummaryProps {
  done: number;
  total: number;
  percent: number;
}

export function ProgressSummary({ done, total, percent }: ProgressSummaryProps) {
  return (
    <div className="w-56 space-y-1.5">
      <p className="text-xs text-muted-foreground">
        {done} of {total} tasks done
      </p>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
}