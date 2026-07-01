import { Trash2 } from "lucide-react";

export function TrashEmpty() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Trash2 className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium">Trash is empty</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Pages you delete will show up here before they're gone for good.
      </p>
    </div>
  );
}
