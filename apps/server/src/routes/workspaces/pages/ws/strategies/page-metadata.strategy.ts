import type { WsStrategy } from "#/lib/ws-router";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { UpdatePageMetadataInput } from "@dotion/shared/pages/types";
import type { PageWsContext } from "../types";

export class PageMetadataUpdateStrategy implements WsStrategy<
  PageWsContext,
  UpdatePageMetadataInput
> {
  readonly messageType = "page.update_metadata";
  readonly requiredPermission: PermissionKey = "page:update";

  async handle(
    ctx: PageWsContext,
    payload: UpdatePageMetadataInput,
  ): Promise<void> {
    await ctx.broadcastMetadata(payload);
    await ctx.persistence?.queueMetadataUpdate(payload, ctx.document);
  }
}
