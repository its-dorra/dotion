import { Result } from 'better-result'
import { ValidationError, AppError, AuthenticationError } from '@/lib/errors'
import {
  PageNotFoundError,
  PageAlreadyInTrashError,
  PageMemberAlreadyExistsError,
  InsufficientPagePermissionError,
} from './errors'
import type {
  TrashedPage,
  PageMemberPermission,
  MoveToTrashInput,
  RestoreFromTrashInput,
  DeletePermanentlyInput,
  UpdatePagePermissionInput,
  InviteToPageInput,
  SetPagePublicInput,
} from './types'

import { getApiClient } from '@/lib/api-client'
import { matchExhaustive } from '@/lib/utils'
import type {
  CreatePageInput,
  Page,
  PageId,
  PageTreeNode,
  PageAccessRequest,
  PageAccessRequestStatusResponse,
  PagePermissionRole,
} from '@dotion/shared/pages/types'
import type { UserId } from '@dotion/shared/users/types'
import type { WorkspaceId } from '../workspaces/types'
import type {
  PaginationQuery,
  PaginatedData,
} from '@dotion/shared/pagination/types'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

interface InternalPage extends Page {
  inTrash: boolean
  deletedAt?: string
  deletedByName?: string
  permissions: PageMemberPermission[]
  updatedAt: Date
  isPublic?: boolean
  publicLinkSlug?: string | null
}

function toPublicPage(page: InternalPage): Page {
  const {
    inTrash: _,
    deletedAt: __,
    deletedByName: ___,
    permissions: ____,
    ...rest
  } = page
  return rest as Page
}

let mockPages: Record<string, InternalPage> = {}

export class PagesApi {
  /**
   * Returns the flat list of non-trashed pages for a workspace. Callers
   * build the nested tree client-side from each node's parentId.
   */
  async getPageTree(
    workspaceId: string,
  ): Promise<
    Result<
      PageTreeNode[],
      InsufficientPagePermissionError | AppError | AuthenticationError
    >
  > {
    const apiClient = getApiClient()

    const response = await apiClient.api.v1.workspaces[':id'].pages.$get({
      param: {
        id: workspaceId,
      },
    })

    if (!response.ok) {
      return matchExhaustive(response.status, {
        '401': () =>
          Result.err(new AuthenticationError({ message: 'Unauthorized' })),
        '403': () =>
          Result.err(
            new InsufficientPagePermissionError({
              message:
                'You do not have permission to view pages in this workspace.',
              requiredRole: 'viewer' as any,
            }),
          ),
        '500': () =>
          Result.err(
            new AppError({
              source: 'Pages',
              message: 'Cannot fetch page tree',
            }),
          ),
      })
    }

    const result = await response.json()

    return Result.ok(result.data)
  }

  async getPage(
    workspaceId: WorkspaceId,
    pageId: PageId,
  ): Promise<
    Result<
      Page,
      | PageNotFoundError
      | InsufficientPagePermissionError
      | AuthenticationError
      | AppError
    >
  > {
    const apiClient = getApiClient()

    const response = await apiClient.api.v1.workspaces[':id'].pages[
      ':pageId'
    ].$get({
      param: {
        id: workspaceId,
        pageId: pageId,
      },
    })

    if (!response.ok) {
      return matchExhaustive(response.status, {
        '401': () =>
          Result.err(
            new AuthenticationError({
              message: 'Unauthorized',
            }),
          ),
        '403': () =>
          Result.err(
            new InsufficientPagePermissionError({
              message: 'You do not have permission to view this page.',
              requiredRole: 'viewer' as any,
            }),
          ),
        '404': () =>
          Result.err(
            new PageNotFoundError({
              message: "This page doesn't exist.",
              pageId,
            }),
          ),
        '500': () =>
          Result.err(
            new AppError({
              source: 'Pages',
              message: 'Cannot fetch page',
            }),
          ),
      })
    }

    const data = await response.json()

    return Result.ok(data.data as unknown as Page)
  }

  async createPage(
    input: CreatePageInput,
  ): Promise<
    Result<
      PageTreeNode,
      | ValidationError
      | InsufficientPagePermissionError
      | AppError
      | AuthenticationError
    >
  > {
    const apiClient = getApiClient()

    const response = await apiClient.api.v1.workspaces[':id'].pages.$post({
      param: {
        id: input.workspaceId,
      },
      json: {
        parentId: input.parentId,
        title: input.title || 'Untitled',
        icon: input.icon,
      },
    })

    if (!response.ok) {
      return matchExhaustive(response.status, {
        '400': () =>
          Result.err(
            new ValidationError({
              message: 'Invalid input for creating a page',
              field: 'input',
            }),
          ),
        '401': () =>
          Result.err(
            new AuthenticationError({
              message: 'Unauthorized',
            }),
          ),
        '403': () =>
          Result.err(
            new InsufficientPagePermissionError({
              message:
                'You do not have permission to create a page in this workspace.',
              requiredRole: 'editor' as any,
            }),
          ),
        '422': () =>
          Result.err(
            new ValidationError({
              message: 'Validation error occurred while creating the page',
              field: 'input',
            }),
          ),
        '500': () =>
          Result.err(
            new AppError({
              source: 'Pages',
              message: 'Failed to create page due to server error',
            }),
          ),
      })
    }

    const result = (await response.json()) as unknown as { data: PageTreeNode }

    return Result.ok(result.data)
  }

  async moveToTrash(
    input: MoveToTrashInput,
  ): Promise<
    Result<
      true,
      | PageNotFoundError
      | PageAlreadyInTrashError
      | InsufficientPagePermissionError
      | AppError
      | AuthenticationError
    >
  > {
    const apiClient = getApiClient()

    const response = await apiClient.api.v1.workspaces[':id'].pages[
      ':pageId'
    ].trash.$post({
      param: {
        id: input.workspaceId,
        pageId: input.pageId,
      },
    })

    if (!response.ok) {
      return matchExhaustive(response.status, {
        '401': () =>
          Result.err(new AuthenticationError({ message: 'Unauthorized' })),
        '403': () =>
          Result.err(
            new InsufficientPagePermissionError({
              message: 'You do not have permission to move this page to trash.',
              requiredRole: 'editor' as any,
            }),
          ),
        '404': () =>
          Result.err(
            new PageNotFoundError({
              message: "This page doesn't exist.",
              pageId: input.pageId,
            }),
          ),
        '500': () =>
          Result.err(
            new AppError({
              source: 'Pages',
              message: 'Failed to move page to trash',
            }),
          ),
      })
    }

    return Result.ok(true)
  }

  async restoreFromTrash(
    input: RestoreFromTrashInput,
  ): Promise<
    Result<
      Page,
      | PageNotFoundError
      | InsufficientPagePermissionError
      | AppError
      | AuthenticationError
    >
  > {
    const apiClient = getApiClient()

    const response = await apiClient.api.v1.workspaces[':id'].pages[
      ':pageId'
    ].restore.$post({
      param: {
        id: input.workspaceId,
        pageId: input.pageId,
      },
    })

    if (!response.ok) {
      return matchExhaustive(response.status, {
        '401': () =>
          Result.err(new AuthenticationError({ message: 'Unauthorized' })),
        '403': () =>
          Result.err(
            new InsufficientPagePermissionError({
              message: 'You do not have permission to restore this page.',
              requiredRole: 'editor' as any,
            }),
          ),
        '404': () =>
          Result.err(
            new PageNotFoundError({
              message: "This page doesn't exist.",
              pageId: input.pageId,
            }),
          ),
        '500': () =>
          Result.err(
            new AppError({
              source: 'Pages',
              message: 'Failed to restore page from trash',
            }),
          ),
      })
    }

    const result = (await response.json()) as unknown as { data: Page }
    return Result.ok(result.data)
  }

  async deletePermanently(
    input: DeletePermanentlyInput,
  ): Promise<
    Result<
      true,
      | PageNotFoundError
      | InsufficientPagePermissionError
      | AppError
      | AuthenticationError
    >
  > {
    const apiClient = getApiClient()

    const response = await apiClient.api.v1.workspaces[':id'].pages[
      ':pageId'
    ].$delete({
      param: {
        id: input.workspaceId,
        pageId: input.pageId,
      },
    })

    if (!response.ok) {
      return matchExhaustive(response.status, {
        '401': () =>
          Result.err(new AuthenticationError({ message: 'Unauthorized' })),
        '403': () =>
          Result.err(
            new InsufficientPagePermissionError({
              message:
                'You do not have permission to permanently delete this page. Only workspace owners can permanently delete pages.',
              requiredRole: 'owner' as any,
            }),
          ),
        '404': () =>
          Result.err(
            new PageNotFoundError({
              message: "This page doesn't exist.",
              pageId: input.pageId,
            }),
          ),
        '500': () =>
          Result.err(
            new AppError({
              source: 'Pages',
              message: 'Failed to permanently delete page',
            }),
          ),
      })
    }

    return Result.ok(true)
  }

  async getTrashedPages(
    workspaceId: string,
  ): Promise<
    Result<
      TrashedPage[],
      InsufficientPagePermissionError | AppError | AuthenticationError
    >
  > {
    const apiClient = getApiClient()

    const response = await apiClient.api.v1.workspaces[':id'].pages.trash.$get({
      param: {
        id: workspaceId,
      },
    })

    if (!response.ok) {
      return matchExhaustive(response.status, {
        '401': () =>
          Result.err(new AuthenticationError({ message: 'Unauthorized' })),
        '403': () =>
          Result.err(
            new InsufficientPagePermissionError({
              message: 'You do not have permission to view trash.',
              requiredRole: 'viewer' as any,
            }),
          ),
        '500': () =>
          Result.err(
            new AppError({
              source: 'Pages',
              message: 'Failed to fetch trashed pages',
            }),
          ),
      })
    }

    const result = (await response.json()) as unknown as { data: Page[] }
    const trashedPages: TrashedPage[] = result.data.map((page) => ({
      id: page.id,
      title: page.title,
      icon: page.icon ?? undefined,
      deletedAt: page.updatedAt
        ? new Date(page.updatedAt).toISOString()
        : new Date().toISOString(),
      deletedByName: '',
    }))

    return Result.ok(trashedPages)
  }

  async getPagePermissions(
    workspaceId: WorkspaceId,
    pageId: PageId,
    query?: PaginationQuery,
  ): Promise<
    Result<
      PaginatedData<PageMemberPermission>,
      InsufficientPagePermissionError | AppError | AuthenticationError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].pages[
        ':pageId'
      ].permissions.$get({
        param: { id: workspaceId, pageId },
        query: {
          page: query?.page ? String(query.page) : '1',
          limit: query?.limit ? String(query.limit) : '20',
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [401]: () =>
            Result.err(
              new AuthenticationError({
                message: 'You must be logged in to view permissions.',
              }),
            ),
          [403]: () =>
            Result.err(
              new InsufficientPagePermissionError({
                message:
                  'You do not have permission to view permissions for this page.',
                requiredRole: 'viewer' as any,
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'pages',
                message: 'Failed to fetch page permissions.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'pages',
                message: `Unexpected error: ${response.status}`,
              }),
            ),
        })
      }

      const json = await response.json()
      const serverData =
        json.data as unknown as PaginatedData<PageMemberPermission>
      return Result.ok(serverData)
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch page permissions.'
      return Result.err(
        new AppError({
          source: 'pages',
          message,
        }),
      )
    }
  }

  async inviteToPage(
    input: InviteToPageInput,
  ): Promise<
    Result<
      PageMemberPermission,
      | PageNotFoundError
      | ValidationError
      | PageMemberAlreadyExistsError
      | InsufficientPagePermissionError
    >
  > {
    await delay(500)

    if (input.actingUserRole && input.actingUserRole !== 'editor') {
      return Result.err(
        new InsufficientPagePermissionError({
          message: 'Only editors can invite others to this page.',
          requiredRole: 'editor',
        }),
      )
    }

    const page = mockPages[input.pageId]
    if (!page) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist.",
          pageId: input.pageId,
        }),
      )
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(input.email)) {
      return Result.err(
        new ValidationError({
          message: 'Enter a valid email address.',
          field: 'email',
        }),
      )
    }

    if (
      page.permissions.some(
        (p) => p.email.toLowerCase() === input.email.toLowerCase(),
      )
    ) {
      return Result.err(
        new PageMemberAlreadyExistsError({
          message: `${input.email} already has access to this page.`,
          email: input.email,
        }),
      )
    }

    const newPermission: PageMemberPermission = {
      id: generateId('perm'),
      userId: generateId('user') as UserId,
      name: input.email.split('@')[0] ?? 'User',
      email: input.email,
      avatarUrl: null,
      joinedAt: new Date(),
      role: input.role,
    }

    mockPages = {
      ...mockPages,
      [page.id]: {
        ...page,
        permissions: [...page.permissions, newPermission],
      },
    }

    return Result.ok(newPermission)
  }

  async updatePagePermission(
    input: UpdatePagePermissionInput,
  ): Promise<
    Result<
      PageMemberPermission,
      | PageNotFoundError
      | InsufficientPagePermissionError
      | AppError
      | AuthenticationError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].pages[
        ':pageId'
      ].permissions[':memberId'].$patch({
        param: {
          id: input.workspaceId,
          pageId: input.pageId,
          memberId: input.userId,
        },
        json: {
          role: input.role,
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [400]: () =>
            Result.err(
              new AppError({
                source: 'pages',
                message: 'Invalid permission role provided.',
              }),
            ),
          [401]: () =>
            Result.err(
              new AuthenticationError({
                message: 'You must be logged in to update permissions.',
              }),
            ),
          [403]: () =>
            Result.err(
              new InsufficientPagePermissionError({
                message:
                  'You do not have permission to update page permissions.',
                requiredRole: 'editor' as any,
              }),
            ),
          [404]: () =>
            Result.err(
              new PageNotFoundError({
                message: 'Member or page not found.',
                pageId: input.pageId,
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'pages',
                message: 'Failed to update page permission.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'pages',
                message: `Unexpected error: ${response.status}`,
              }),
            ),
        })
      }

      const json = await response.json()
      const serverData = json.data as unknown as PageMemberPermission
      return Result.ok(serverData)
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update page permission.'
      return Result.err(
        new AppError({
          source: 'pages',
          message,
        }),
      )
    }
  }

  async setPagePublic(
    input: SetPagePublicInput,
  ): Promise<Result<Page, PageNotFoundError>> {
    await delay(400)

    const page = mockPages[input.pageId]
    if (!page) {
      return Result.err(
        new PageNotFoundError({
          message: "This page doesn't exist.",
          pageId: input.pageId,
        }),
      )
    }

    const updated: InternalPage = {
      ...page,
      isPublic: input.isPublic,
      publicLinkSlug: input.isPublic
        ? (page.publicLinkSlug ?? generateId('link'))
        : page.publicLinkSlug,
    }
    mockPages = { ...mockPages, [page.id]: updated }

    return Result.ok(toPublicPage(updated))
  }

  async createAccessRequest(
    workspaceId: WorkspaceId,
    pageId: PageId,
    requestedRole: PagePermissionRole = 'editor',
  ): Promise<
    Result<
      PageAccessRequest,
      | AppError
      | AuthenticationError
      | InsufficientPagePermissionError
      | PageNotFoundError
    >
  > {
    try {
      const client = getApiClient()
      const response = await client.api.v1.workspaces[':id'].pages[':pageId'][
        'access-requests'
      ].$post({
        param: {
          id: workspaceId,
          pageId,
        },
        json: {
          requestedRole,
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          401: () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          403: () =>
            Result.err(
              new InsufficientPagePermissionError({
                message: 'Access denied.',
                requiredRole: 'editor',
              }),
            ),
          404: () =>
            Result.err(
              new PageNotFoundError({
                pageId,
                message: 'Page not found.',
              }),
            ),
          500: () =>
            Result.err(
              new AppError({
                source: 'pages',
                message: 'Failed to request page access.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'pages',
                message: `Unexpected error: ${response.status}`,
              }),
            ),
        })
      }

      const json = await response.json()
      return Result.ok(json.data as unknown as PageAccessRequest)
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to request page access.'
      return Result.err(
        new AppError({
          source: 'pages',
          message,
        }),
      )
    }
  }

  async getAccessRequestStatus(
    workspaceId: WorkspaceId,
    pageId: PageId,
  ): Promise<
    Result<
      PageAccessRequestStatusResponse,
      AppError | AuthenticationError | InsufficientPagePermissionError
    >
  > {
    try {
      const client = getApiClient()
      const response = await client.api.v1.workspaces[':id'].pages[':pageId'][
        'access-requests'
      ].status.$get({
        param: {
          id: workspaceId,
          pageId,
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          401: () =>
            Result.err(
              new AuthenticationError({ message: 'Authentication required.' }),
            ),
          403: () =>
            Result.err(
              new InsufficientPagePermissionError({
                message: 'Access denied.',
                requiredRole: 'editor',
              }),
            ),
          500: () =>
            Result.err(
              new AppError({
                source: 'pages',
                message: 'Failed to get request status.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'pages',
                message: `Unexpected error: ${response.status}`,
              }),
            ),
        })
      }

      const json = await response.json()
      return Result.ok(json.data as unknown as PageAccessRequestStatusResponse)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to get request status.'
      return Result.err(
        new AppError({
          source: 'pages',
          message,
        }),
      )
    }
  }

  async approveAccessRequest(
    workspaceId: WorkspaceId,
    pageId: PageId,
    requestId: string,
  ): Promise<Result<PageAccessRequest, AppError>> {
    try {
      const client = getApiClient()
      const response = await client.api.v1.workspaces[':id'].pages[':pageId'][
        'access-requests'
      ][':requestId'].approve.$post({
        param: {
          id: workspaceId,
          pageId,
          requestId,
        },
      })

      if (!response.ok) {
        return Result.err(
          new AppError({
            source: 'pages',
            message: 'Failed to approve access request.',
          }),
        )
      }

      const json = await response.json()
      return Result.ok(json.data as unknown as PageAccessRequest)
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to approve access request.'
      return Result.err(
        new AppError({
          source: 'pages',
          message,
        }),
      )
    }
  }

  async rejectAccessRequest(
    workspaceId: WorkspaceId,
    pageId: PageId,
    requestId: string,
  ): Promise<Result<PageAccessRequest, AppError>> {
    try {
      const client = getApiClient()
      const response = await client.api.v1.workspaces[':id'].pages[':pageId'][
        'access-requests'
      ][':requestId'].reject.$post({
        param: {
          id: workspaceId,
          pageId,
          requestId,
        },
      })

      if (!response.ok) {
        return Result.err(
          new AppError({
            source: 'pages',
            message: 'Failed to reject access request.',
          }),
        )
      }

      const json = await response.json()
      return Result.ok(json.data as unknown as PageAccessRequest)
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to reject access request.'
      return Result.err(
        new AppError({
          source: 'pages',
          message,
        }),
      )
    }
  }
}

export const pagesApi = new PagesApi()
