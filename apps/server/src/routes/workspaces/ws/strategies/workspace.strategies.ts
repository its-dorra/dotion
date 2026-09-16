import type { WsStrategy } from "#/lib/ws-router";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { WorkspaceWsMessage } from "@dotion/shared/workspaces/types";
import type { WorkspaceWsContext } from "../types";

type DocumentTitleChangedPayload = Extract<
  WorkspaceWsMessage,
  { type: "document.title.changed" }
>["payload"];

type DocumentIconChangedPayload = Extract<
  WorkspaceWsMessage,
  { type: "document.icon.changed" }
>["payload"];

type DocumentCoverChangedPayload = Extract<
  WorkspaceWsMessage,
  { type: "document.cover.changed" }
>["payload"];

export class DocumentTitleChangedStrategy implements WsStrategy<
  WorkspaceWsContext,
  DocumentTitleChangedPayload
> {
  readonly messageType = "document.title.changed";
  readonly requiredPermission: PermissionKey = "workspace:view";

  handle(ctx: WorkspaceWsContext, payload: DocumentTitleChangedPayload): void {
    ctx.broadcastToAllExceptSender({
      type: "document.title.changed",
      payload,
    });
  }
}

export class DocumentIconChangedStrategy implements WsStrategy<
  WorkspaceWsContext,
  DocumentIconChangedPayload
> {
  readonly messageType = "document.icon.changed";
  readonly requiredPermission: PermissionKey = "workspace:view";

  handle(ctx: WorkspaceWsContext, payload: DocumentIconChangedPayload): void {
    ctx.broadcastToAllExceptSender({
      type: "document.icon.changed",
      payload,
    });
  }
}

export class DocumentCoverChangedStrategy implements WsStrategy<
  WorkspaceWsContext,
  DocumentCoverChangedPayload
> {
  readonly messageType = "document.cover.changed";
  readonly requiredPermission: PermissionKey = "workspace:view";

  handle(ctx: WorkspaceWsContext, payload: DocumentCoverChangedPayload): void {
    ctx.broadcastToAllExceptSender({
      type: "document.cover.changed",
      payload,
    });
  }
}
