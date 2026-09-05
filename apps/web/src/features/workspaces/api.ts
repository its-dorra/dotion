import { Result } from 'better-result'
import { ValidationError, AppError, AuthenticationError } from '@/lib/errors'
import { getApiClient } from '@/lib/api-client'
import {
  WorkspaceNotFoundError,
  InvitationNotFoundError,
  MemberAlreadyExistsError,
  CannotRemoveOwnerError,
  InsufficientWorkspacePermissionError,
} from './errors'
import type {
  WorkspaceInvitation,
  WorkspaceMember,
  CreateWorkspaceInput,
  InviteMemberInput,
  AcceptInvitationInput,
  DeclineInvitationInput,
  UpdateMemberRoleInput,
  RemoveMemberInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceId,
} from './types'
import type {
  PaginationQuery,
  PaginatedData,
} from '@dotion/shared/pagination/types'
import type { UserSearchResult } from '@dotion/shared/users/types'

export class WorkspacesApi {
  async getWorkspaces(): Promise<
    Result<Workspace[], AuthenticationError | AppError>
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces.$get()

      if (!response.ok) {
        if (response.status === 401) {
          return Result.err(
            new AuthenticationError({
              message: 'You must be logged in to view workspaces.',
            }),
          )
        }
        return Result.err(
          new AppError({
            source: 'workspaces',
            message: 'An internal server error occurred.',
          }),
        )
      }

      const data = await response.json()
      return Result.ok(data.data as unknown as Workspace[])
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to load workspaces.',
        }),
      )
    }
  }

  async getWorkspace(
    workspaceId: string,
  ): Promise<
    Result<Workspace, AuthenticationError | WorkspaceNotFoundError | AppError>
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].$get({
        param: { id: workspaceId as WorkspaceId },
      })

      if (!response.ok) {
        if (response.status === 401) {
          return Result.err(
            new AuthenticationError({
              message: 'You must be logged in to view this workspace.',
            }),
          )
        }
        if (response.status === 404) {
          return Result.err(
            new WorkspaceNotFoundError({
              message: `Workspace "${workspaceId}" was not found.`,
              workspaceId: workspaceId as WorkspaceId,
            }),
          )
        }
        return Result.err(
          new AppError({
            source: 'workspaces',
            message: 'An internal server error occurred.',
          }),
        )
      }

      const data = await response.json()
      return Result.ok(data.data as unknown as Workspace)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to load workspace.',
        }),
      )
    }
  }

  async createWorkspace(
    input: CreateWorkspaceInput,
  ): Promise<
    Result<Workspace, ValidationError | AppError | AuthenticationError>
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces.$post({
        json: input,
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null

        if (response.status === 401) {
          return Result.err(
            new AuthenticationError({
              message: 'You must be logged in to create a workspace.',
            }),
          )
        }
        if (response.status === 422 || response.status === 400) {
          return Result.err(
            new ValidationError({
              message: body?.error ?? 'Invalid workspace data.',
            }),
          )
        }
        return Result.err(
          new AppError({
            source: 'workspaces',
            message: 'An internal server error occurred.',
          }),
        )
      }

      const data = await response.json()
      return Result.ok(data.data as unknown as Workspace)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create workspace.',
        }),
      )
    }
  }

  async updateWorkspace(
    input: UpdateWorkspaceInput,
  ): Promise<Result<Workspace, ValidationError | AppError>> {
    return Result.ok({
      id: input.workspaceId,
      name: input.name ?? '',
      icon: input.icon ?? null,
      membersCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  async getMembers(
    workspaceId: string,
    pagination: PaginationQuery = { page: 1, limit: 20 },
  ): Promise<
    Result<
      PaginatedData<WorkspaceMember>,
      WorkspaceNotFoundError | AuthenticationError | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].members.$get({
        param: { id: workspaceId as WorkspaceId },
        query: {
          page: String(pagination.page),
          limit: String(pagination.limit),
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          return Result.err(
            new AuthenticationError({
              message: 'You must be logged in to view workspace members.',
            }),
          )
        }
        if (response.status === 404) {
          return Result.err(
            new WorkspaceNotFoundError({
              message: `Workspace "${workspaceId}" was not found.`,
              workspaceId: workspaceId as WorkspaceId,
            }),
          )
        }
        return Result.err(
          new AppError({
            source: 'workspaces',
            message: 'Failed to load workspace members.',
          }),
        )
      }

      const data = await response.json()
      return Result.ok(data.data as unknown as PaginatedData<WorkspaceMember>)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to load workspace members.',
        }),
      )
    }
  }

  async inviteMember(
    input: InviteMemberInput,
  ): Promise<
    Result<
      WorkspaceInvitation,
      | ValidationError
      | MemberAlreadyExistsError
      | WorkspaceNotFoundError
      | InsufficientWorkspacePermissionError
      | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[
        ':id'
      ].invitations.$post({
        param: { id: input.workspaceId },
        json: {
          userId: input.userId,
          email: input.email,
        },
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        const errorMsg = body?.error ?? 'Failed to invite member'

        if (response.status === 400) {
          if (errorMsg.includes('already a member')) {
            return Result.err(
              new MemberAlreadyExistsError({
                message: errorMsg,
                email: input.email ?? '',
              }),
            )
          }
          if (errorMsg.includes('permission') || errorMsg.includes('owners')) {
            return Result.err(
              new InsufficientWorkspacePermissionError({
                message: errorMsg,
                requiredRole: 'owner',
              }),
            )
          }
          return Result.err(new ValidationError({ message: errorMsg }))
        }

        if (response.status === 404) {
          return Result.err(
            new WorkspaceNotFoundError({
              message: errorMsg,
              workspaceId: input.workspaceId,
            }),
          )
        }

        return Result.err(
          new AppError({
            source: 'workspaces',
            message: errorMsg,
          }),
        )
      }

      const data = await response.json()
      return Result.ok(data.data as unknown as WorkspaceInvitation)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error ? error.message : 'Failed to invite member.',
        }),
      )
    }
  }

  async getWorkspaceInvitations(
    workspaceId: string,
    pagination: PaginationQuery = { page: 1, limit: 20 },
  ): Promise<
    Result<
      PaginatedData<WorkspaceInvitation>,
      WorkspaceNotFoundError | AuthenticationError | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[
        ':id'
      ].invitations.$get({
        param: { id: workspaceId as WorkspaceId },
        query: {
          page: String(pagination.page),
          limit: String(pagination.limit),
        },
      })

      if (!response.ok) {
        return Result.err(
          new AppError({
            source: 'workspaces',
            message: 'Failed to load workspace invitations.',
          }),
        )
      }

      const data = await response.json()
      return Result.ok(
        data.data as unknown as PaginatedData<WorkspaceInvitation>,
      )
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to load workspace invitations.',
        }),
      )
    }
  }

  async cancelWorkspaceInvitation(
    workspaceId: string,
    invitationId: string,
  ): Promise<
    Result<true, WorkspaceNotFoundError | AuthenticationError | AppError>
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].invitations[
        ':invitationId'
      ].$delete({
        param: {
          id: workspaceId as WorkspaceId,
          invitationId: invitationId as any,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          return Result.err(
            new AuthenticationError({
              message: 'You must be logged in to cancel an invitation.',
            }),
          )
        }
        if (response.status === 404) {
          return Result.err(
            new WorkspaceNotFoundError({
              message: 'Invitation not found.',
              workspaceId: workspaceId as WorkspaceId,
            }),
          )
        }
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        return Result.err(
          new AppError({
            source: 'workspaces',
            message: body?.error ?? 'Failed to cancel invitation.',
          }),
        )
      }

      return Result.ok(true)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to cancel invitation.',
        }),
      )
    }
  }

  async acceptInvitation(
    input: AcceptInvitationInput,
  ): Promise<Result<Workspace, InvitationNotFoundError | AppError>> {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces.invitations[
        ':invitationId'
      ].accept.$post({
        param: { invitationId: input.invitationId as any },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return Result.err(
            new InvitationNotFoundError({
              message: 'This invitation no longer exists.',
              invitationId: input.invitationId,
            }),
          )
        }
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        return Result.err(
          new AppError({
            source: 'workspaces',
            message: body?.error ?? 'Failed to accept invitation.',
          }),
        )
      }

      const data = await response.json()
      return Result.ok(data.data as unknown as Workspace)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to accept invitation.',
        }),
      )
    }
  }

  async declineInvitation(
    input: DeclineInvitationInput,
  ): Promise<Result<true, InvitationNotFoundError | AppError>> {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces.invitations[
        ':invitationId'
      ].decline.$post({
        param: { invitationId: input.invitationId as any },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return Result.err(
            new InvitationNotFoundError({
              message: 'This invitation no longer exists.',
              invitationId: input.invitationId,
            }),
          )
        }
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        return Result.err(
          new AppError({
            source: 'workspaces',
            message: body?.error ?? 'Failed to decline invitation.',
          }),
        )
      }

      return Result.ok(true)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to decline invitation.',
        }),
      )
    }
  }

  async updateMemberRole(
    input: UpdateMemberRoleInput,
  ): Promise<
    Result<
      WorkspaceMember,
      WorkspaceNotFoundError | InsufficientWorkspacePermissionError | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].members[
        ':memberId'
      ].$patch({
        param: {
          id: input.workspaceId,
          memberId: input.memberId as any,
        },
        json: {
          role: input.role,
        },
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        const errorMsg = body?.error ?? 'Failed to update member role.'

        if (response.status === 400 && errorMsg.includes('owner')) {
          return Result.err(
            new InsufficientWorkspacePermissionError({
              message: errorMsg,
              requiredRole: 'owner',
            }),
          )
        }

        return Result.err(
          new AppError({
            source: 'workspaces',
            message: errorMsg,
          }),
        )
      }

      const data = await response.json()
      return Result.ok(data.data as unknown as WorkspaceMember)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to update member role.',
        }),
      )
    }
  }

  async removeMember(
    input: RemoveMemberInput,
  ): Promise<
    Result<
      true,
      | WorkspaceNotFoundError
      | CannotRemoveOwnerError
      | InsufficientWorkspacePermissionError
      | AppError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].members[
        ':memberId'
      ].$delete({
        param: {
          id: input.workspaceId,
          memberId: input.memberId as any,
        },
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        const errorMsg = body?.error ?? 'Failed to remove member.'

        if (errorMsg.includes('owner')) {
          return Result.err(
            new CannotRemoveOwnerError({
              message: errorMsg,
            }),
          )
        }

        return Result.err(
          new AppError({
            source: 'workspaces',
            message: errorMsg,
          }),
        )
      }

      return Result.ok(true)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error ? error.message : 'Failed to remove member.',
        }),
      )
    }
  }

  async searchCandidateUsers({
    workspaceId,
    query,
    page = 1,
    limit = 20,
  }: {
    workspaceId: string
    query: string
    page?: number
    limit?: number
  }): Promise<Result<PaginatedData<UserSearchResult>, AppError>> {
    try {
      const apiClient = getApiClient()
      const response = await (apiClient.api.v1.workspaces as any)[':id'][
        'candidate-users'
      ].$get({
        param: { id: workspaceId },
        query: {
          q: query,
          page: String(page),
          limit: String(limit),
        },
      })

      if (!response.ok) {
        return Result.err(
          new AppError({
            source: 'workspaces',
            message: 'Failed to search candidate users.',
          }),
        )
      }

      const data = await response.json()
      return Result.ok(data.data as unknown as PaginatedData<UserSearchResult>)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'workspaces',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to search candidate users.',
        }),
      )
    }
  }
}

export const workspacesApi = new WorkspacesApi()
