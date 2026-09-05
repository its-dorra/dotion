import { TaggedError } from "better-result";

export class ForbiddenError extends TaggedError("ForbiddenError")<{
  message: string;
  reason?: string;
}> {}

export class UnauthorizedError extends TaggedError("UnauthorizedError")<{
  message: string;
}> {}

export type AuthorizationError = ForbiddenError | UnauthorizedError;
