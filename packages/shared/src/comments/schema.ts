import { z } from "zod";
import { comments } from "@dotion/db/schema";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { commentId, pageId, userId } from "../ids";

export { commentId };

export const CommentSchema = createSelectSchema(comments, {
  id: commentId,
  pageId,
  authorId: userId,
  parentId: commentId.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateCommentSchema = createInsertSchema(comments, {
  id: commentId,
  pageId,
  authorId: userId,
  parentId: commentId.nullable(),
}).pick({
  pageId: true,
  authorId: true,
  parentId: true,
  body: true,
});

export const CommentAuthorSchema = z.object({
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
});

export const CommentWithAuthorSchema = z.object({
  id: commentId,
  pageId,
  authorId: userId,
  parentId: commentId.nullable(),
  body: z.string(),
  isResolved: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  author: CommentAuthorSchema,
});

export const CommentWithRepliesAndAuthorSchema = CommentWithAuthorSchema.extend(
  {
    replies: z.array(CommentWithAuthorSchema),
  },
);
