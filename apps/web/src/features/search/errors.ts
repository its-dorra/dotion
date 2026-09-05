import { TaggedError } from 'better-result'

export class SearchError extends TaggedError('SearchError')<{
  message: string
}> {}
