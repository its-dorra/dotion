import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PagePermissionRole } from "../types";

interface InviteToPageFormProps {
  onInvite: (email: string, role: PagePermissionRole) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

export function InviteToPageForm({
  onInvite,
  isSubmitting,
  errorMessage,
}: InviteToPageFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PagePermissionRole>("editor");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    onInvite(email.trim(), role);
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-8 flex-1 text-sm"
        />
        <Select
          value={role}
          onValueChange={(value) => setRole(value as PagePermissionRole)}
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="commenter">Commenter</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={isSubmitting || !email.trim()}>
        {isSubmitting ? "Inviting…" : "Invite"}
      </Button>
    </form>
  );
}
