import { UserPlus } from "lucide-react";

export function MembersEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <UserPlus className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">It's just you for now</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Invite teammates above to start collaborating on this workspace.
      </p>
    </div>
  );
}
