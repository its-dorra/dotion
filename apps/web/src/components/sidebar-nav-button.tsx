import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: boolean;
}

export function SidebarNavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  badge,
}: SidebarNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span className="relative">
        <Icon className="h-4 w-4 shrink-0" />
        {badge ? (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
        ) : null}
      </span>
      {isActive ? <span>{label}</span> : null}
    </button>
  );
}
