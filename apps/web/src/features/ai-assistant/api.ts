import { Result } from 'better-result'
import { AuthenticationError, AuthorizationError, AppError } from '@/lib/errors'
import { getApiClient } from '@/lib/api-client'
import { matchExhaustive } from '@/lib/utils'
import {
  AssistantError,
  ThreadNotFoundError,
  QuotaExceededError,
} from './errors'
import type {
  AssistantThread,
  PaginatedThreadsResponse,
  PaginatedMessagesResponse,
  CreateThreadRequest,
  StreamChatOptions,
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
          '401': () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          '403': () =>
            Result.err(
              new AuthorizationError({
                message: 'Access denied for this workspace.',
              }),
            ),
          '500': () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: 'Failed to fetch conversation threads.',
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
    input: CreateThreadRequest = {},
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
        json: input,
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          '401': () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          '403': () =>
            Result.err(
              new AuthorizationError({
                message: 'Access denied for this workspace.',
              }),
            ),
          '500': () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: 'Failed to create new conversation thread.',
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
          '401': () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          '403': () =>
            Result.err(
              new AuthorizationError({
                message: 'Access denied for this workspace.',
              }),
            ),
          '500': () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: 'Failed to delete conversation thread.',
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
          '401': () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          '403': () =>
            Result.err(
              new AuthorizationError({
                message: 'Access denied for this workspace.',
              }),
            ),
          '404': () =>
            Result.err(
              new ThreadNotFoundError({
                message: 'Conversation thread not found.',
                threadId,
              }),
            ),
          '500': () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: 'Failed to fetch thread messages.',
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

  async streamChat(
    workspaceId: WorkspaceId,
    threadId: AssistantThreadId,
    content: string,
    options: StreamChatOptions = {},
  ): Promise<
    Result<
      string,
      | AuthenticationError
      | AuthorizationError
      | ThreadNotFoundError
      | QuotaExceededError
      | AssistantError
      | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[
        ':id'
      ].assistant.threads[':threadId'].chat.$post(
        {
          param: { id: workspaceId, threadId },
          json: { content },
        },
        {
          init: {
            signal: options.signal,
          },
        },
      )

      if (!response.ok) {
        if (response.status === 429) {
          const errData = (await response.json().catch(() => ({}))) as {
            error?: string
            resetAt?: number
          }
          return Result.err(
            new QuotaExceededError({
              message:
                errData.error ?? 'Daily AI token generation quota reached.',
              resetAt: errData.resetAt,
            }),
          )
        }

        return matchExhaustive(response.status, {
          '400': () =>
            Result.err(
              new AssistantError({
                message: 'Invalid message request payload.',
              }),
            ),
          '401': () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          '403': () =>
            Result.err(
              new AuthorizationError({
                message: 'Access denied for this workspace.',
              }),
            ),
          '404': () =>
            Result.err(
              new ThreadNotFoundError({
                message: 'Conversation thread not found.',
                threadId,
              }),
            ),
          '429': () =>
            Result.err(
              new QuotaExceededError({
                message: 'Token quota exceeded.',
              }),
            ),
          '500': () =>
            Result.err(
              new AppError({
                source: 'AiAssistant',
                message: 'AI streaming service error.',
              }),
            ),
        })
      }

      if (!response.body) {
        return Result.err(
          new AssistantError({ message: 'Empty response body from AI server' }),
        )
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullAccumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // Parse stream protocol parts (e.g. 0:"text delta"\n or raw chunk)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.trim()) continue

          // Check if AI SDK UI message format 0:"..."
          if (line.startsWith('0:')) {
            try {
              const textContent = JSON.parse(line.slice(2))
              if (typeof textContent === 'string') {
                fullAccumulatedText += textContent
                options.onChunk?.(textContent)
              }
            } catch {
              // fallback to raw line
              fullAccumulatedText += line.slice(2)
              options.onChunk?.(line.slice(2))
            }
          } else if (line.startsWith('d:') || line.startsWith('e:')) {
            // metadata / finish chunks
          } else {
            fullAccumulatedText += line
            options.onChunk?.(line)
          }
        }
      }

      options.onFinish?.(fullAccumulatedText)
      return Result.ok(fullAccumulatedText)
    } catch (error) {
      if (options.signal?.aborted) {
        return Result.ok('')
      }
      console.error('AiAssistantApi.streamChat error:', error)
      return Result.err(
        new AppError({
          source: 'AiAssistant',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to stream chat answer.',
        }),
      )
    }
  }
}

export const aiAssistantApi = new AiAssistantApi()
