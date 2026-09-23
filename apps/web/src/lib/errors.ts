import { TaggedError } from 'better-result'

export class AuthenticationError extends TaggedError('AuthenticationError')<{
  message: string
}> {}

export class AuthorizationError extends TaggedError('AuthorizationError')<{
  message: string
}> {}

export class ValidationError extends TaggedError('ValidationError')<{
  message: string
  field?: string
}> {}

export class NotFoundError extends TaggedError('NotFoundError')<{
  message: string
}> {}

export class ConflictError extends TaggedError('ConflictError')<{
  message: string
}> {}

export class ServerError extends TaggedError('ServerError')<{
  message: string
}> {}

export class AppError extends TaggedError('AppError')<{
  source: string
  message: string
}> {}

export type CommonError =
  | AuthenticationError
  | AuthorizationError
  | ValidationError
  | NotFoundError
  | ConflictError
  | ServerError
  | AppError
