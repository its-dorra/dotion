import { TaggedError } from 'better-result'

export class AuthorizationError extends TaggedError('AuthorizationError')<{
  message: string
  reason?: string
}> {}

export class InsufficientPermissionError extends TaggedError(
  'InsufficientPermissionError',
)<{
  message: string
  resource: string
  action: string
  reason?: string
}> {}
