import { Skeleton } from "@/components/ui/skeleton";

export function CommentsLoading() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="space-y-2.5 rounded-md border p-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}
