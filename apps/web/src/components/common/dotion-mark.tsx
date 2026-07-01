import { cn } from "@/lib/utils";

export default function DotionMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background",
        className,
      )}
    >
      <span className="text-[13px] font-semibold leading-none">D</span>
    </div>
  );
}
