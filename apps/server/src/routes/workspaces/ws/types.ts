import type { BaseWsContext } from "#/lib/ws-router";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { UserId } from "@dotion/shared/users/types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { WorkspaceWsMessage } from "@dotion/shared/workspaces/types";

export interface WorkspaceWsAttachment {
  userId: UserId;
  workspaceId: WorkspaceId;
  permissions: Set<PermissionKey>;
}

export interface WorkspaceWsContext extends BaseWsContext {
  readonly workspaceId: WorkspaceId;
  broadcastToAll(data: WorkspaceWsMessage): void;
  broadcastToAllExceptSender(data: WorkspaceWsMessage): void;
}
