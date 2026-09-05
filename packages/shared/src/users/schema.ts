import { z } from "zod";
import { users } from "@dotion/db/schema";
import { createSelectSchema } from "drizzle-orm/zod";
import { userId, workspaceId } from "../ids";
import {
  PaginationQuerySchema,
  createPaginatedDataSchema,
} from "../pagination/schema";

export { userId };

export const UserSchema = createSelectSchema(users, {
  id: userId,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const UserSearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().min(1),
  workspaceId: workspaceId.optional(),
});

export const UserSearchResultSchema = UserSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
});

export const PaginatedUserSearchResultsDataSchema = createPaginatedDataSchema(
  UserSearchResultSchema,
);
