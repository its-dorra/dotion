import { AtSign, Mail, ShieldCheck, UserPlus } from "lucide-react";
import type { NotificationType } from "../types";

const iconByType: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  workspace_invitation: Mail,
  page_invitation: Mail,
  permission_change: ShieldCheck,
  mention: AtSign,
  page_access_request: UserPlus,
};

interface NotificationIconProps {
  type: NotificationType;
}

export function NotificationIcon({ type }: NotificationIconProps) {
  const Icon = iconByType[type];
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
