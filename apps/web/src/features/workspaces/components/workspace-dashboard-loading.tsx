import { Skeleton } from '@/components/ui/skeleton'

export function WorkspaceDashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Pages Section Skeleton */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
