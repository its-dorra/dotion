import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "./member-avatar";
import { RoleBadge } from "./role-badge";
import type { WorkspaceMember, WorkspaceRole } from "../types";

interface MemberRowProps {
  member: WorkspaceMember;
  canManage: boolean;
  onChangeRole: (memberId: string, role: WorkspaceRole) => void;
  onRemove: (memberId: string) => void;
}

export function MemberRow({
  member,
  canManage,
  onChangeRole,
  onRemove,
}: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <MemberAvatar name={member.name} avatarUrl={member.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {member.email}
        </p>
      </div>
      <RoleBadge role={member.role} />
      {canManage && member.role !== "owner" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={member.role === "admin"}
              onSelect={() => onChangeRole(member.id, "admin")}
            >
              Make admin
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={member.role === "member"}
              onSelect={() => onChangeRole(member.id, "member")}
            >
              Make member
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => onRemove(member.id)}
            >
              Remove from workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
