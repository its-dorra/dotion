import type { z } from "zod";
import type {
  commentId,
  CommentSchema,
  CreateCommentSchema,
  CommentAuthorSchema,
  CommentWithAuthorSchema,
  CommentWithRepliesAndAuthorSchema,
} from "./schema";
import type { CommentWsMessageSchema } from "./ws.schema";

export type CommentId = z.infer<typeof commentId>;
export type Comment = z.infer<typeof CommentSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type CommentAuthor = z.infer<typeof CommentAuthorSchema>;
export type CommentWithAuthor = z.infer<typeof CommentWithAuthorSchema>;
export type CommentWithRepliesAndAuthor = z.infer<
  typeof CommentWithRepliesAndAuthorSchema
>;
export type CommentWsMessage = z.infer<typeof CommentWsMessageSchema>;
