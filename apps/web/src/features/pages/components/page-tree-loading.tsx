import { Skeleton } from "@/components/ui/skeleton";

export function PageTreeLoading() {
  return (
    <div className="space-y-1.5 px-2 py-1">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-5 w-[80%]" />
      ))}
    </div>
  );
}
