import { Skeleton } from "@/components/shared/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** Shown while the Dashboard loads. It mirrors the real page so nothing jumps when the data arrives. */
export default function DashboardLoading() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading your dashboard…</span>

      <header className="flex min-h-16 items-center justify-between gap-3 border-b px-4 sm:min-h-[70px] sm:px-7">
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="-ml-1 lg:hidden" />
          <Skeleton className="h-6 w-44 sm:w-60" />
        </div>
        <Skeleton className="size-10 sm:h-9 sm:w-32" />
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-5 sm:space-y-5 sm:p-6 lg:p-7">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2 rounded-xl border px-4 py-4 sm:px-5">
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 pt-2 sm:pt-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
          <div className="order-last min-w-0 space-y-4 xl:order-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-10 w-full sm:h-9 sm:w-56" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-4 rounded-xl border p-5">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-1.5 w-full" />
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <Skeleton className="size-6 rounded-full" />
                      <Skeleton className="size-6 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <Skeleton className="h-5 w-20" />
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border px-4 py-3">
                  <Skeleton className="size-5 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}