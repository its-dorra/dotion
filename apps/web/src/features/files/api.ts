import { Result } from 'better-result'
import {
  ValidationError,
  AppError,
  AuthenticationError,
  AuthorizationError,
} from '@/lib/errors'
import { matchExhaustive } from '@/lib/utils'
import type { FileUploadResponse } from '@dotion/shared/files/types'
import type { WorkspaceId } from '../workspaces/types'
import type { PageId } from '../pages/types'

export class FilesApi {
  async uploadFile(input: {
    workspaceId: WorkspaceId
    pageId: PageId
    file: File
  }): Promise<
    Result<
      FileUploadResponse,
      AuthenticationError | AuthorizationError | ValidationError | AppError
    >
  > {
    try {
      const response = await fetch(
        `/api/v1/workspaces/${input.workspaceId}/pages/${input.pageId}/files`,
        {
          method: 'POST',
          headers: {
            'Content-Type': input.file.type || 'application/octet-stream',
            'X-File-Name': encodeURIComponent(input.file.name || 'file'),
            'X-File-Size': String(input.file.size),
          },
          body: input.file,
          credentials: 'include',
        },
      )

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [400]: () =>
            Result.err(
              new ValidationError({
                message: 'Invalid file payload or file exceeds size limit.',
              }),
            ),
          [401]: () =>
            Result.err(
              new AuthenticationError({
                message: 'You must be logged in to upload files.',
              }),
            ),
          [403]: () =>
            Result.err(
              new AuthorizationError({
                message:
                  'You do not have permission to upload files to this page.',
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'files',
                message: 'Failed to upload file to storage.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'files',
                message: `Unexpected error: ${response.status}`,
              }),
            ),
        })
      }

      const json = (await response.json()) as {
        success: boolean
        data: FileUploadResponse
      }
      return Result.ok(json.data)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to upload file.'
      return Result.err(
        new AppError({
          source: 'files',
          message,
        }),
      )
    }
  }

  resolveFileUrl(url: string): string {
    if (!url) return ''

    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:') ||
      url.startsWith('blob:')
    ) {
      return url
    }

    if (url.startsWith('/')) {
      return typeof window !== 'undefined'
        ? `${window.location.origin}${url}`
        : url
    }

    return url
  }
}

export const filesApi = new FilesApi()
