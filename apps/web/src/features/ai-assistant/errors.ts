import { TaggedError } from "better-result";

export class ConversationNotFoundError extends TaggedError(
  "ConversationNotFoundError",
)<{
  message: string;
  conversationId: string;
}>() {}

export class EmptyMessageError extends TaggedError(
  "EmptyMessageError",
)<{
  message: string;
}>() {}
