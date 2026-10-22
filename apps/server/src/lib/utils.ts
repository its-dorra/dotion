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

export { generateUserColor, hslToHex } from "@dotion/shared/users/colors";
