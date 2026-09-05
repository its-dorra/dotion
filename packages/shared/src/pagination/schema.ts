import { z } from "zod";

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export function createPaginatedDataSchema<T extends z.ZodTypeAny>(
  payloadSchema: T,
) {
  return z.object({
    pagination: PaginationMetaSchema,
    payload: z.array(payloadSchema),
  });
}
