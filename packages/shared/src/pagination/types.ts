import type { z } from "zod";
import type { PaginationQuerySchema, PaginationMetaSchema } from "./schema";

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export interface PaginatedData<T> {
  pagination: PaginationMeta;
  payload: T[];
}
