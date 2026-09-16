import type { Decision } from "@dotion/shared/authorization/decisions";
import type { ResourceType } from "@dotion/shared/authorization/types";
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
        const listed = await this.kv.list({ prefix });
        await Promise.all(listed.keys.map((k) => this.kv!.delete(k.name)));
      }
    } catch (e) {
      console.error("Failed to invalidate cache prefix:", prefix, e);
    }
  }

  async invalidateUserPermissions({
    userId,
    resourceType,
    id,
  }: {
    userId: string;
    resourceType?: ResourceType;
    id?: string;
  }): Promise<void> {
    const prefix = resourceType
      ? `authz:${userId}:${resourceType}:`
      : `authz:${userId}:`;

    await this.invalidatePrefix(prefix);

    if (resourceType === "page" && id) {
      const pageActions = [
        "view",
        "update",
        "delete",
        "restore",
        "move",
        "managePermissions",
        "share",
      ];
      await Promise.all(
        pageActions.map((action) =>
          this.delete(
            `authz:${userId}:page:${action}:${JSON.stringify({ pageId: id })}`,
          ),
        ),
      );
    }
  }
}
