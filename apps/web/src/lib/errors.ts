import { TaggedError } from "better-result";

/**
 * Shared, cross-feature error types.
 * Feature-specific errors should live in that feature's `types.ts`
 * and extend/compose with these where it makes sense.
 */

export class AuthenticationError extends TaggedError(
  "AuthenticationError",
)<{
  message: string;
}>() {}

export class AuthorizationError extends TaggedError(
  "AuthorizationError",
)<{
  message: string;
}>() {}

export class ValidationError extends TaggedError(
  "ValidationError",
)<{
  message: string;
  field?: string;
}>() {}

export class NotFoundError extends TaggedError(
  "NotFoundError",
)<{
  message: string;
}>() {}

export class ConflictError extends TaggedError(
  "ConflictError",
)<{
  message: string;
}>() {}

export class ServerError extends TaggedError(
  "ServerError",
)<{
  message: string;
}>() {}

export class AppError extends TaggedError(
  "AppError",
)<{
  source: string;
  message: string;
}>() {}

/**
 * Union of the common, shared error types. Feature-level error unions
 * should extend this with their own feature-specific tagged errors.
 */
export type CommonError =
  | AuthenticationError
  | AuthorizationError
  | ValidationError
  | NotFoundError
  | ConflictError
  | ServerError
  | AppError;
