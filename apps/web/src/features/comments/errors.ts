import { TaggedError } from "better-result";

export class ThreadNotFoundError extends TaggedError(
  "ThreadNotFoundError",
)<{
  message: string;
  threadId: string;
}>() {}

export class CommentNotFoundError extends TaggedError(
  "CommentNotFoundError",
)<{
  message: string;
  commentId: string;
}>() {}

export class InsufficientCommentPermissionError extends TaggedError(
  "InsufficientCommentPermissionError",
)<{
  message: string;
}>() {}
