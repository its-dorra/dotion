import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberAvatar } from "@/features/workspaces/components/member-avatar";
import type { PageMemberPermission, PagePermissionRole } from "../types";

interface PagePermissionRowProps {
  permission: PageMemberPermission;
  canManage: boolean;
  onChangeRole: (userId: string, role: PagePermissionRole) => void;
}

export function PagePermissionRow({
  permission,
  canManage,
  onChangeRole,
}: PagePermissionRowProps) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <MemberAvatar name={permission.name} avatarUrl={permission.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{permission.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {permission.email}
        </p>
      </div>
      {canManage ? (
        <Select
          value={permission.role}
          onValueChange={(value) =>
            onChangeRole(permission.userId, value as PagePermissionRole)
          }
        >
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="commenter">Commenter</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <span className="text-xs capitalize text-muted-foreground">
          {permission.role}
        </span>
      )}
    </div>
  );
}
