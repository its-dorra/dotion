import type { BaseWsContext } from "#/lib/ws-router";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { UserId } from "@dotion/shared/users/types";
import type { UserWsMessage } from "@dotion/shared/notifications/ws.schema";
import type { AppContext } from "#/context";

export interface UserWsAttachment {
  userId: UserId;
  permissions: Set<PermissionKey>;
}

export interface UserWsContext extends BaseWsContext {
  readonly services: AppContext["services"];
  broadcastToUser(message: UserWsMessage, excludeCurrentTab?: boolean): void;
}
