import { Result } from 'better-result'
import { getApiClient } from '@/lib/api-client'
import { AppError, AuthenticationError } from '@/lib/errors'
import type {
  CheckPermissionResponse,
  Permission,
  CanParams,
} from '@dotion/shared/authorization/types'

export class AuthorizationApi {
  async checkPermission<P extends Permission>(
    params: CanParams<P>,
  ): Promise<Result<CheckPermissionResponse, AuthenticationError | AppError>> {
    try {
      const apiClient = getApiClient()
      const query = this.buildQueryParams(params)
      const response = await apiClient.api.v1.authorization.check.$get({
        query: query as Parameters<
          typeof apiClient.api.v1.authorization.check.$get
        >[0]['query'],
      })

      if (!response.ok) {
        if (response.status === 401) {
          return Result.err(
            new AuthenticationError({
              message: 'You must be authenticated to check permissions.',
            }),
          )
        }
        return Result.err(
          new AppError({
            source: 'authorization',
            message: 'Failed to evaluate authorization check.',
          }),
        )
      }

      const body = await response.json()
      return Result.ok(body.data)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'authorization',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to check permission.',
        }),
      )
    }
  }

  private buildQueryParams<P extends Permission>(
    params: CanParams<P>,
  ): Record<string, string> {
    const query: Record<string, string> = {
      permission: params.permission,
    }
    if (params.workspaceId) {
      query.workspaceId = String(params.workspaceId)
    }
    if ('container' in params && params.container) {
      for (const [key, value] of Object.entries(params.container)) {
        if (value !== undefined) {
          query[key] = String(value)
        }
      }
    }
    if ('target' in params && params.target) {
      for (const [key, value] of Object.entries(params.target)) {
        if (value !== undefined) {
          query[key] = String(value)
        }
      }
    }
    return query
  }
}

export const authorizationApi = new AuthorizationApi()
