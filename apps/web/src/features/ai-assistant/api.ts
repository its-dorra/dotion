import { Result } from 'better-result'
import { AuthenticationError, AuthorizationError, AppError } from '@/lib/errors'
import { getApiClient } from '@/lib/api-client'
import { matchExhaustive } from '@/lib/utils'
import { AssistantError, ThreadNotFoundError } from './errors'
import type {
  AssistantThread,
  PaginatedThreadsResponse,
  PaginatedMessagesResponse,
  WorkspaceId,
  AssistantThreadId,
} from './types'

export class AiAssistantApi {
  async listThreads(
    workspaceId: WorkspaceId,
    pagination: { cursor?: string; limit?: number } = {},
  ): Promise<
    Result<
      PaginatedThreadsResponse,
      AuthenticationError | AuthorizationError | AssistantError | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[
        ':id'
      ].assistant.threads.$get({
        param: { id: workspaceId },
        query: {
          cursor: pagination.cursor,
          limit:
            pagination.limit !== undefined
              ? String(pagination.limit)
              : undefined,
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [401]: () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          [403]: () =>
            Result.err(
              new AuthorizationError({
                message: 'Access denied for this workspace.',
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: 'Failed to fetch conversation threads.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: `Failed to fetch conversation threads: ${response.status}`,
              }),
            ),
        })
      }

      const data = await response.json()
      return Result.ok(data as unknown as PaginatedThreadsResponse)
    } catch (error) {
      console.error('AiAssistantApi.listThreads error:', error)
      return Result.err(
        new AppError({
          source: 'AiAssistant',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch conversation threads.',
        }),
      )
    }
  }

  async createThread(
    workspaceId: WorkspaceId,
  ): Promise<
    Result<
      AssistantThread,
      AuthenticationError | AuthorizationError | AssistantError | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[
        ':id'
      ].assistant.threads.$post({
        param: { id: workspaceId },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [401]: () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          [403]: () =>
            Result.err(
              new AuthorizationError({
                message: 'Access denied for this workspace.',
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: 'Failed to create new conversation thread.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: `Failed to create conversation thread: ${response.status}`,
              }),
            ),
        })
      }

      const data = await response.json()
      return Result.ok(data as unknown as AssistantThread)
    } catch (error) {
      console.error('AiAssistantApi.createThread error:', error)
      return Result.err(
        new AppError({
          source: 'AiAssistant',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create conversation thread.',
        }),
      )
    }
  }

  async deleteThread(
    workspaceId: WorkspaceId,
    threadId: AssistantThreadId,
  ): Promise<
    Result<
      void,
      AuthenticationError | AuthorizationError | AssistantError | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[
        ':id'
      ].assistant.threads[':threadId'].$delete({
        param: { id: workspaceId, threadId },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [401]: () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          [403]: () =>
            Result.err(
              new AuthorizationError({
                message: 'Access denied for this workspace.',
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: 'Failed to delete conversation thread.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: `Failed to delete conversation thread: ${response.status}`,
              }),
            ),
        })
      }

      return Result.ok(undefined)
    } catch (error) {
      console.error('AiAssistantApi.deleteThread error:', error)
      return Result.err(
        new AppError({
          source: 'AiAssistant',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to delete conversation thread.',
        }),
      )
    }
  }

  async listMessages(
    workspaceId: WorkspaceId,
    threadId: AssistantThreadId,
    pagination: { cursor?: string; limit?: number } = {},
  ): Promise<
    Result<
      PaginatedMessagesResponse,
      AuthenticationError | AuthorizationError | ThreadNotFoundError | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[
        ':id'
      ].assistant.threads[':threadId'].messages.$get({
        param: { id: workspaceId, threadId },
        query: {
          cursor: pagination.cursor,
          limit:
            pagination.limit !== undefined
              ? String(pagination.limit)
              : undefined,
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [401]: () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          [403]: () =>
            Result.err(
              new AuthorizationError({
                message: 'Access denied for this workspace.',
              }),
            ),
          [404]: () =>
            Result.err(
              new ThreadNotFoundError({
                message: 'Conversation thread not found.',
                threadId,
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: 'Failed to fetch thread messages.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: `Failed to fetch thread messages: ${response.status}`,
              }),
            ),
        })
      }

      const data = await response.json()
      return Result.ok(data as unknown as PaginatedMessagesResponse)
    } catch (error) {
      console.error('AiAssistantApi.listMessages error:', error)
      return Result.err(
        new AppError({
          source: 'AiAssistant',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch thread messages.',
        }),
      )
    }
  }
}

export const aiAssistantApi = new AiAssistantApi()
