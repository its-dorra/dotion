import { useState, type FormEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "../types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ProfilePresenterProps {
  user: UserProfile;
  onSave: (name: string) => void;
  isSaving: boolean;
  errorMessage?: string;
}

export function ProfilePresenter({
  user,
  onSave,
  isSaving,
  errorMessage,
}: ProfilePresenterProps) {
  const [name, setName] = useState(user.name);
  const hasChanges = name.trim() !== user.name;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!hasChanges) return;
    onSave(name.trim());
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="text-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">Profile photo</p>
            <p className="text-sm text-muted-foreground">
              Photo uploads aren't available yet.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" value={user.email} disabled />
          <p className="text-xs text-muted-foreground">
            Contact a workspace owner to change your email.
          </p>
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <Button type="submit" disabled={!hasChanges || isSaving}>
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
