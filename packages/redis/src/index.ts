import { env } from "@notion-clone/env/server";
import Redis from "ioredis";

export const redisInstance = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
});
