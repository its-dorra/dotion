import type { PermissionChangeNotification } from "../types";

export function PermissionChangeContent({
  notification,
}: {
  notification: PermissionChangeNotification;
}) {
  return (
    <p className="text-sm">
      <span className="font-medium">{notification.changedByName}</span> made
      you {notification.newRole} on{" "}
      <span className="font-medium">{notification.pageTitle}</span>
    </p>
  );
}
