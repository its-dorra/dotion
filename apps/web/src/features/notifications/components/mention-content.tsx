import type { MentionNotification } from "../types";

export function MentionContent({
  notification,
}: {
  notification: MentionNotification;
}) {
  return (
    <div className="text-sm">
      <p>
        <span className="font-medium">{notification.mentionedByName}</span>{" "}
        mentioned you in{" "}
        <span className="font-medium">{notification.pageTitle}</span>
      </p>
      <p className="mt-0.5 truncate text-muted-foreground">
        {notification.excerpt}
      </p>
    </div>
  );
}
