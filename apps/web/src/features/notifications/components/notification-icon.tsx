import { Mail, ShieldCheck, UserPlus } from "lucide-react";
import type { NotificationType } from "../types";

const iconByType: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  workspace_invitation: Mail,
  page_invitation: Mail,
  permission_change: ShieldCheck,
  page_access_request: UserPlus,
  page_access_request_resolved: ShieldCheck,
};

interface NotificationIconProps {
  type: NotificationType;
}

export function NotificationIcon({ type }: NotificationIconProps) {
  const Icon = iconByType[type];
  if (!Icon) return null;

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
