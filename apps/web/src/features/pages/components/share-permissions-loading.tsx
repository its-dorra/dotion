import { Skeleton } from "@/components/ui/skeleton";

export function SharePermissionsLoading() {
  return (
    <div className="space-y-2 py-1">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="flex items-center gap-2.5">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
