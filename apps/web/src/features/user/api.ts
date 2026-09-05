import { Result } from 'better-result'
import { AppError } from '@/lib/errors'
import { getApiClient } from '@/lib/api-client'
import type { UserSearchResult } from '@dotion/shared/users/types'
import type { PaginatedData } from '@dotion/shared/pagination/types'

export class UserApi {
  async searchUsers({
    query,
    page = 1,
    limit = 20,
  }: {
    query: string
    page?: number
    limit?: number
  }): Promise<Result<PaginatedData<UserSearchResult>, AppError>> {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.users.search.$get({
        query: {
          q: query,
          page: String(page),
          limit: String(limit),
        },
      })

      if (!response.ok) {
        return Result.err(
          new AppError({
            source: 'users',
            message: 'Failed to search users.',
          }),
        )
      }

      const data = await response.json()
      return Result.ok(data.data as unknown as PaginatedData<UserSearchResult>)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'users',
          message:
            error instanceof Error ? error.message : 'Failed to search users.',
        }),
      )
    }
  }
}

export const userApi = new UserApi()
