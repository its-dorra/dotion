import { Skeleton } from "@/components/ui/skeleton";

export function AiAssistantLoading() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="mt-auto flex gap-1.5">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
