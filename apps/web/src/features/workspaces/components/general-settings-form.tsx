import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WorkspaceIcon } from "./workspace-icon";
import type { Workspace } from "../types";

interface GeneralSettingsFormProps {
  workspace: Workspace;
  canManage: boolean;
  onSave: (name: string) => void;
  isSaving: boolean;
  errorMessage?: string;
}

export function GeneralSettingsForm({
  workspace,
  canManage,
  onSave,
  isSaving,
  errorMessage,
}: GeneralSettingsFormProps) {
  const [name, setName] = useState(workspace.name);
  const hasChanges = name.trim() !== workspace.name;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!hasChanges) return;
    onSave(name.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <WorkspaceIcon icon={workspace.icon} name={workspace.name} size="lg" />
        <div className="flex-1 space-y-2">
          <Label htmlFor="workspace-name-setting">Workspace name</Label>
          <Input
            id="workspace-name-setting"
            value={name}
            disabled={!canManage}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      </div>
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {canManage ? (
        <Button type="submit" disabled={!hasChanges || isSaving}>
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only the workspace owner or admins can change these settings.
        </p>
      )}
    </form>
  );
}
