import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/shared/skeleton";

/** Shown while My tasks loads. The title is real; only the data is a placeholder. */
export default function TasksLoading() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading your tasks…</span>
      <PageHeader title="My tasks" />

      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-5 sm:p-6 lg:p-7">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2 rounded-xl border px-4 py-4 sm:px-5">
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-11 w-full max-w-72 rounded-xl" />
              <div className="flex w-full gap-2 sm:w-auto">
                <Skeleton className="h-11 flex-1 rounded-xl sm:w-56 sm:flex-none" />
                <Skeleton className="h-11 w-36 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border px-4 py-3.5">
                  <Skeleton className="size-6 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-4 rounded-2xl border p-5">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-1.5 w-full" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}