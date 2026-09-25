import type { Decision } from "@dotion/shared/authorization/decisions";
import type { UserId } from "@dotion/shared/users/types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { PageId } from "@dotion/shared/pages/types";
import type { PermissionCacheInvalidator } from "../realtime.types";

export interface KVNamespaceLike {
  get<T = unknown>(
    key: string,
    type?: "text" | "json" | "arrayBuffer" | "stream",
  ): Promise<T | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list?(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

export interface AuthorizationCache extends PermissionCacheInvalidator {
  get(key: string): Promise<Decision | null>;
  set(key: string, decision: Decision, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidatePrefix(prefix: string): Promise<void>;
}

export class KVAuthorizationCache implements AuthorizationCache {
  constructor(private readonly kv: KVNamespace | KVNamespaceLike) {}

  async get(key: string): Promise<Decision | null> {
    try {
      const data = await this.kv.get<Decision>(key, "json");
      return data ?? null;
    } catch {
      return null;
    }
  }

  async set(key: string, decision: Decision, ttlSeconds = 300): Promise<void> {
    try {
      await this.kv.put(key, JSON.stringify(decision), {
        expirationTtl: Math.max(ttlSeconds, 60),
      });
    } catch (e) {
      console.error("Failed to write cache key:", key, e);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (e) {
      console.error("Failed to delete cache key:", key, e);
    }
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    try {
      if (this.kv.list) {
        let cursor: string | undefined = undefined;
        do {
          const res: {
            keys: { name: string }[];
            list_complete?: boolean;
            cursor?: string;
          } = await this.kv.list({ prefix, cursor });
          if (res.keys && res.keys.length > 0) {
            await Promise.all(
              res.keys.map((k: { name: string }) => this.kv.delete(k.name)),
            );
          }
          cursor = res.list_complete === false ? res.cursor : undefined;
        } while (cursor);
      }
    } catch (e) {
      console.error("Failed to invalidate cache prefix:", prefix, e);
    }
  }

  async invalidateUserPermissions({
    userId,
    workspaceId,
    pageId,
  }: {
    userId: UserId;
    workspaceId?: WorkspaceId;
    pageId?: PageId;
  }): Promise<void> {
    const explicitDeletes: Promise<void>[] = [];
    const prefixes: string[] = [];

    if (workspaceId && pageId) {
      const pageActions = [
        "view",
        "update",
        "delete",
        "restore",
        "deletePermanently",
        "move",
        "managePermissions",
        "share",
      ];
      const commentActions = ["create", "list"];
      const pagePermissionActions = ["view", "update", "delete", "list"];

      for (const action of pageActions) {
        explicitDeletes.push(
          this.delete(
            `authz:${userId}:${workspaceId}:${pageId}:page:${action}`,
          ),
        );
      }
      for (const action of commentActions) {
        explicitDeletes.push(
          this.delete(
            `authz:${userId}:${workspaceId}:${pageId}:comment:${action}`,
          ),
        );
      }
      for (const action of pagePermissionActions) {
        explicitDeletes.push(
          this.delete(
            `authz:${userId}:${workspaceId}:${pageId}:pagePermission:${action}`,
          ),
        );
      }

      prefixes.push(`authz:${userId}:${workspaceId}:${pageId}:`);
    } else if (workspaceId) {
      const workspaceActions = [
        "view",
        "update",
        "delete",
        "inviteMember",
        "manageSettings",
      ];

      for (const action of workspaceActions) {
        explicitDeletes.push(
          this.delete(`authz:${userId}:${workspaceId}:_:workspace:${action}`),
        );
      }
      explicitDeletes.push(
        this.delete(`authz:${userId}:${workspaceId}:_:workspaceMember:list`),
        this.delete(
          `authz:${userId}:${workspaceId}:_:workspaceInvitation:list`,
        ),
        this.delete(`authz:${userId}:${workspaceId}:_:page:create`),
        this.delete(`authz:${userId}:${workspaceId}:_:page:list`),
        this.delete(`authz:${userId}:${workspaceId}:_:page:listTrash`),
        this.delete(`authz:${userId}:${workspaceId}:_:page:emptyTrash`),
      );

      prefixes.push(`authz:${userId}:${workspaceId}:`);
    } else {
      prefixes.push(`authz:${userId}:`);
    }

    await Promise.all([
      ...prefixes.map((prefix) => this.invalidatePrefix(prefix)),
      ...explicitDeletes,
    ]);
  }
}
