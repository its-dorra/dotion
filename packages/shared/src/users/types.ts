import type { z } from "zod";
import type {
  userId,
  UserSchema,
  UserSearchQuerySchema,
  UserSearchResultSchema,
  PaginatedUserSearchResultsDataSchema,
} from "./schema";

export type UserId = z.infer<typeof userId>;
export type User = z.infer<typeof UserSchema>;
export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;
export type UserSearchResult = z.infer<typeof UserSearchResultSchema>;
export type PaginatedUserSearchResults = z.infer<
  typeof PaginatedUserSearchResultsDataSchema
>;
