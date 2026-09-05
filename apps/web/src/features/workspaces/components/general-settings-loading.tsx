import { Skeleton } from "@/components/ui/skeleton";

export function GeneralSettingsLoading() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
