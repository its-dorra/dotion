import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsLoading() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 px-2 py-2.5">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
