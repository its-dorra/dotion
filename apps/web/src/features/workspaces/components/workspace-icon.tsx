import { cn } from "@/lib/utils";

interface WorkspaceIconProps {
  icon?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-5 w-5 text-sm rounded",
  md: "h-7 w-7 text-base rounded-md",
  lg: "h-12 w-12 text-2xl rounded-lg",
};

export function WorkspaceIcon({
  icon,
  name,
  size = "md",
  className,
}: WorkspaceIconProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-muted leading-none",
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      {icon ?? name.charAt(0).toUpperCase()}
    </div>
  );
}
