import { Skeleton } from "@/components/ui/skeleton";

export function PageDetailLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="mx-auto w-full max-w-3xl px-12 pt-10">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <Skeleton className="mt-4 h-10 w-2/3" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
