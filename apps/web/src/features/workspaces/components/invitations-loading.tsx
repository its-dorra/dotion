import { Skeleton } from "@/components/ui/skeleton";

export function InvitationsLoading() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-md border p-3">
          <Skeleton className="h-7 w-7 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
