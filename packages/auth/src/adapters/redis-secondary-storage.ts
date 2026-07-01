import type { SecondaryStorage } from "better-auth";
import { redisInstance as redis } from "@notion-clone/redis";
import { redisStorage } from "@better-auth/redis-storage";

export const redisSecondaryStorage: SecondaryStorage = redisStorage({
  client: redis,
  keyPrefix: "better-auth",
});
