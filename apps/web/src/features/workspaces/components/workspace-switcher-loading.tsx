import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSwitcherLoading() {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
      <Skeleton className="h-7 w-7 rounded-md" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}
