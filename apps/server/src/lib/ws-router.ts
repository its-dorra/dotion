import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { UserId } from "@dotion/shared/users/types";

export interface BaseWsContext {
  readonly ws: WebSocket;
  readonly userId: UserId;
  hasPermission(permission: PermissionKey): boolean;
  onUnauthorized?(permission: PermissionKey): void;
}

export interface WsStrategy<
  TContext extends BaseWsContext,
  TPayload = unknown,
> {
  readonly messageType: string | number;
  readonly requiredPermission?: PermissionKey;
  handle(ctx: TContext, payload: TPayload): Promise<void> | void;
}

export class WsRouter<TContext extends BaseWsContext> {
  private readonly strategies = new Map<
    string | number,
    WsStrategy<TContext, unknown>
  >();

  register<TPayload>(strategy: WsStrategy<TContext, TPayload>): this {
    this.strategies.set(
      strategy.messageType,
      strategy as WsStrategy<TContext, unknown>,
    );
    return this;
  }

  async dispatch(
    ctx: TContext,
    messageType: string | number,
    payload: unknown,
  ): Promise<void> {
    const strategy = this.strategies.get(messageType);
    if (!strategy) {
      console.warn(
        `[WsRouter] No strategy registered for message: ${messageType}`,
      );
      return;
    }

    if (
      strategy.requiredPermission &&
      !ctx.hasPermission(strategy.requiredPermission)
    ) {
      console.warn(
        `[WsRouter] Permission '${strategy.requiredPermission}' denied for user ${ctx.userId}`,
      );
      ctx.onUnauthorized?.(strategy.requiredPermission);
      return;
    }

    await strategy.handle(ctx, payload);
  }
}
