import { Skeleton } from "@/components/ui/skeleton";

export function TrashLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Skeleton className="mb-1 h-7 w-24" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-2">
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
