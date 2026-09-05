import { Skeleton } from "@/components/ui/skeleton";

export function ProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <Skeleton className="mb-6 h-7 w-24" />
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
