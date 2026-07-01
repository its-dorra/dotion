import { Inbox } from "lucide-react";

export function NotificationsEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">You're all caught up</p>
      <p className="max-w-[220px] text-sm text-muted-foreground">
        Invitations, mentions, and updates will show up here.
      </p>
    </div>
  );
}
