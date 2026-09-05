import { Result } from 'better-result'
import { getApiClient } from '@/lib/api-client'
import { AppError, AuthenticationError } from '@/lib/errors'
import type { CanParams } from './types'
import type {
  CheckPermissionResponse,
  ResourceType,
  ResourceAction,
} from '@dotion/shared/authorization/types'

export class AuthorizationApi {
  async checkPermission<R extends ResourceType, A extends ResourceAction<R>>(
    params: CanParams<R, A>,
  ): Promise<Result<CheckPermissionResponse, AuthenticationError | AppError>> {
    try {
      const apiClient = getApiClient()
      const query = this.buildQueryParams(params)

      const response = await apiClient.api.v1.authorization.check.$get({
        query: query as any,
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

  private buildQueryParams<R extends ResourceType, A extends ResourceAction<R>>(
    params: CanParams<R, A>,
  ): Record<string, string> {
    if (typeof params.resource === 'string') {
      const query: Record<string, string> = {
        resource: params.resource,
        action: String(params.action),
      }
      if ('scope' in params && params.scope) {
        for (const [key, value] of Object.entries(params.scope)) {
          if (value !== undefined) {
            query[key] = String(value)
          }
        }
      }
      return query
    }

    const res = params.resource
    const query: Record<string, string> = {
      resource: res.type,
      action: String(params.action),
    }
    if ('id' in res && res.id) {
      for (const [key, value] of Object.entries(res.id)) {
        if (value !== undefined) {
          query[key] = String(value)
        }
      }
    }
    return query
  }
}

export const authorizationApi = new AuthorizationApi()
