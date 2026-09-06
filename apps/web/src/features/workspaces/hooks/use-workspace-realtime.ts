import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/hooks/use-session'
import { useWorkspaceWsContext } from '../components/workspace-ws-context'
import { useEffect } from 'react'
import {
  handleDocumentCoverChangedWsMessage,
  handleDocumentIconChangedWsMessage,
  handleDocumentTitleChangedWsMessage,
  handlePageAddedWsMessage,
  handlePageMovedToTrashWsMessage,
  handlePageRestoredWsMessage,
  handlePageDeletedPermanentlyWsMessage,
  updatePagePermissionInCache,
} from '@/features/pages/utils'
import type { PagePermissionRole } from '@/features/pages/types'
import {
  handleMemberJoinedWsMessage,
  handleMemberRemovedWsMessage,
  handleInvitationCreatedWsMessage,
  handleInvitationDeclinedWsMessage,
  handleInvitationCancelledWsMessage,
} from '../utils'
import type { Workspace } from '../types'
import { workspacesKeys } from '../query-options'
import { authorizationKeys } from '@/features/authorization/query-options'
import { pagesKeys } from '@/features/pages/query-options'
import { m } from '@/paraglide/messages'

function getTranslatedRole(role: string) {
  switch (role) {
    case 'owner':
      return m.workspace_role_owner()
    case 'editor':
      return m.page_role_editor()
    case 'commenter':
      return m.page_role_commenter()
    case 'viewer':
      return m.workspace_role_viewer()
    default:
      return role
  }
}

export const useWorkspaceRealtime = () => {
  const { workspaceId, subscribe } = useWorkspaceWsContext()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const unsubscribe = subscribe(({ payload: data, source }) => {
      if (source !== 'websocket') {
        return
      }
      switch (data.type) {
        case 'page.created': {
          handlePageAddedWsMessage(queryClient, data.payload)
          break
        }
        case 'page.moved_to_trash': {
          handlePageMovedToTrashWsMessage(queryClient, data.payload)
          break
        }
        case 'page.restored': {
          handlePageRestoredWsMessage(queryClient, data.payload)
          break
        }
        case 'page.deleted_permanently': {
          handlePageDeletedPermanentlyWsMessage(queryClient, data.payload)
          break
        }
        case 'document.title.changed': {
          handleDocumentTitleChangedWsMessage(queryClient, data.payload)
          break
        }
        case 'document.icon.changed': {
          handleDocumentIconChangedWsMessage(queryClient, data.payload)
          break
        }
        case 'document.cover.changed': {
          handleDocumentCoverChangedWsMessage(queryClient, data.payload)
          break
        }
        case 'page.permission_updated': {
          updatePagePermissionInCache(
            queryClient,
            data.payload.workspaceId,
            data.payload.pageId,
            data.payload.userId,
            data.payload.role as PagePermissionRole,
          )
          if (data.payload.userId === currentUserId) {
            queryClient.invalidateQueries({
              queryKey: authorizationKeys.all,
            })
            queryClient.invalidateQueries({
              queryKey: pagesKeys.detail(data.payload.pageId),
            })
            toast.info(
              m.toast_page_role_updated({
                role: getTranslatedRole(data.payload.role),
              }),
            )
          }
          break
        }
        case 'workspace.invitation_created': {
          handleInvitationCreatedWsMessage(queryClient, data.payload)
          if (data.payload.invitedByUserId !== currentUserId) {
            toast.info(
              m.toast_workspace_invited({
                email:
                  data.payload.invitedUserEmail ||
                  data.payload.invitedUserName ||
                  'user',
              }),
            )
          }
          break
        }
        case 'workspace.invitation_declined': {
          handleInvitationDeclinedWsMessage(queryClient, data.payload)
          toast.info(m.toast_workspace_invitation_declined())
          break
        }
        case 'workspace.invitation_cancelled': {
          handleInvitationCancelledWsMessage(queryClient, data.payload)
          toast.info(m.toast_workspace_invitation_cancelled())
          break
        }
        case 'workspace.member_joined': {
          handleMemberJoinedWsMessage(queryClient, workspaceId, data.payload)
          if (data.payload.member.userId !== currentUserId) {
            toast.info(
              m.toast_workspace_member_joined({
                name: data.payload.member.name,
              }),
            )
          }
          break
        }
        case 'workspace.member_removed': {
          if (data.payload.userId === currentUserId) {
            toast.error(m.toast_workspace_removed())
            queryClient.setQueryData<Workspace[]>(
              workspacesKeys.list(),
              (old) => old?.filter((w) => w.id !== workspaceId),
            )
            navigate({ to: '/app/workspaces' })
          } else {
            handleMemberRemovedWsMessage(queryClient, data.payload)
            toast.info(m.toast_workspace_member_removed())
          }
          break
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [currentUserId, navigate, queryClient, subscribe, workspaceId])
}
