import { z } from "@hono/zod-openapi";

export function createErrorObjectSchema(exampleMessage?: string) {
  return z.object({
    error: z.string().openapi({
      example: exampleMessage ?? "An error occurred",
    }),
    success: z.literal(false),
  });
}

export function errorResponseJson(errorMessage: string) {
  return {
    success: false,
    error: errorMessage,
  } as const;
}

export function successResponseJson<T>(data: T) {
  return {
    success: true,
    data,
  } as const;
}

export function generateUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}
