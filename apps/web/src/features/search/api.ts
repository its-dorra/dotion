import { Result } from 'better-result'
import { AuthenticationError, AuthorizationError, AppError } from '@/lib/errors'
import { getApiClient } from '@/lib/api-client'
import { matchExhaustive } from '@/lib/utils'
import { SearchError } from './errors'
import type {
  SearchResultItem,
  SearchRequestQuery,
  WorkspaceId,
  PaginatedData,
} from './types'

export class SearchApi {
  async search(
    workspaceId: WorkspaceId,
    query: SearchRequestQuery,
  ): Promise<
    Result<
      PaginatedData<SearchResultItem>,
      AuthenticationError | AuthorizationError | SearchError | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].search.$get({
        param: {
          id: workspaceId,
        },
        query: {
          q: query.q,
          page: query.page !== undefined ? String(query.page) : undefined,
          limit: query.limit !== undefined ? String(query.limit) : undefined,
          mode: query.mode,
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [400]: () =>
            Result.err(new SearchError({ message: 'Invalid search query.' })),
          [401]: () =>
            Result.err(
              new AuthenticationError({
                message: 'You must be logged in to search workspace documents.',
              }),
            ),
          [403]: () =>
            Result.err(
              new AuthorizationError({
                message: 'You do not have permission to search this workspace.',
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'Search',
                message: 'Search query execution failed.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'Search',
                message: `Failed to search workspace documents: ${response.status}`,
              }),
            ),
        })
      }

      const result = await response.json()
      return Result.ok(result.data)
    } catch (error) {
      console.error('SearchApi.search error:', error)
      return Result.err(
        new AppError({
          source: 'Search',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to search workspace documents',
        }),
      )
    }
  }
}

export const searchApi = new SearchApi()
