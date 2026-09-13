import { TaggedError } from "better-result";

export class AIError extends TaggedError("AIError")<{
  message: string;
  cause?: Error;
}> {}

export class QuotaExceededError extends TaggedError("QuotaExceededError")<{
  message: string;
  resetAt?: number;
}> {}

export class EmbeddingError extends TaggedError("EmbeddingError")<{
  message: string;
  cause?: Error;
}> {}
