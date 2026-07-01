import { cn } from "@/lib/utils";

interface MemberAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md";
  className?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MemberAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: MemberAvatarProps) {
  const dimension = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", dimension, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary",
        dimension,
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
