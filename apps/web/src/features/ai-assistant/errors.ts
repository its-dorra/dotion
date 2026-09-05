import { TaggedError } from 'better-result'

export class AssistantError extends TaggedError('AssistantError')<{
  message: string
}> {}

export class ThreadNotFoundError extends TaggedError('ThreadNotFoundError')<{
  message: string
  threadId?: string
}> {}

export class QuotaExceededError extends TaggedError('QuotaExceededError')<{
  message: string
  resetAt?: number
}> {}
