import { Button } from "@/components/ui/button";
import type { PageAccessRequestNotification } from "../types";

interface PageAccessRequestContentProps {
  notification: PageAccessRequestNotification;
  onGrantAccess: (notification: PageAccessRequestNotification) => void;
  isGranting: boolean;
}

export function PageAccessRequestContent({
  notification,
  onGrantAccess,
  isGranting,
}: PageAccessRequestContentProps) {
  return (
    <div>
      <p className="text-sm">
        <span className="font-medium">{notification.requestedByName}</span>{" "}
        requested access to{" "}
        <span className="font-medium">{notification.pageTitle}</span>
      </p>
      {!notification.isRead ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-1.5 h-7 text-xs"
          disabled={isGranting}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onGrantAccess(notification);
          }}
        >
          {isGranting ? "Granting…" : "Grant access"}
        </Button>
      ) : null}
    </div>
  );
}
