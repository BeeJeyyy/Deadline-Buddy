import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/shared/skeleton";

function CardSkeleton({ rows, tall }: { rows: number; tall?: boolean }) {
  return (
    <div className="space-y-5 rounded-2xl border px-4 py-6 sm:px-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {tall && <Skeleton className="size-16 rounded-full" />}
      <div className="space-y-5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-6">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shown while Settings loads. The title is real; the cards are placeholders. */
export default function SettingsLoading() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading your settings…</span>
      <PageHeader title="Settings" />

      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-4 px-4 py-5 sm:gap-6 sm:p-6 lg:p-7 xl:grid-cols-2">
        <div className="space-y-4 sm:space-y-6">
          <CardSkeleton rows={2} tall />
          <CardSkeleton rows={3} />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <CardSkeleton rows={1} />
          <CardSkeleton rows={4} />
          <CardSkeleton rows={2} />
        </div>
      </div>
    </div>
  );
}