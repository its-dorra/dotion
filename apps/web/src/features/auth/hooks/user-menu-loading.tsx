import { Skeleton } from "@/components/ui/skeleton";

export function UserMenuLoading() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}
