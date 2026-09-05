import z from "zod";
import { commentId, CommentWithRepliesAndAuthorSchema } from "./schema";

export const CommentWsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("comment.created"),
    payload: z.object({
      comment: CommentWithRepliesAndAuthorSchema,
    }),
  }),
  z.object({
    type: z.literal("comment.resolved"),
    payload: z.object({
      commentId,
    }),
  }),
  z.object({
    type: z.literal("comment.deleted"),
    payload: z.object({
      commentId,
      parentId: commentId.nullable(),
      isRoot: z.boolean(),
    }),
  }),
]);
