import { Badge } from "@/components/ui/badge";
import type { WorkspaceRole } from "../types";

const roleLabels: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

interface RoleBadgeProps {
  role: WorkspaceRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <Badge variant={role === "owner" ? "default" : "secondary"}>
      {roleLabels[role]}
    </Badge>
  );
}
