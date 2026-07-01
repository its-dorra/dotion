import { useState, type FormEvent } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateWorkspaceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

export function CreateWorkspaceDrawer({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  errorMessage,
}: CreateWorkspaceDrawerProps) {
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(name);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
    >
      <DrawerContent>
        <form onSubmit={handleSubmit}>
          <DrawerHeader>
            <DrawerTitle>Create a workspace</DrawerTitle>
            <DrawerDescription>
              A workspace organizes pages for you and your team.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4">
            <Label htmlFor="workspace-name-mobile">Workspace name</Label>
            <Input
              id="workspace-name-mobile"
              autoFocus
              placeholder="Acme Inc"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Creating…" : "Create workspace"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
