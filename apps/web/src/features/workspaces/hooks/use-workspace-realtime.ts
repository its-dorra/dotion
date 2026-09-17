import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/hooks/use-session'
import { useWorkspaceWsContext } from '../components/workspace-ws-context'
import { useEffect, useRef } from 'react'
import {
  handleDocumentCoverChangedWsMessage,
  handleDocumentIconChangedWsMessage,
  handleDocumentTitleChangedWsMessage,
  handlePageAddedWsMessage,
  handlePageMovedToTrashWsMessage,
  handlePageRestoredWsMessage,
  handlePageDeletedPermanentlyWsMessage,
  handleTrashEmptiedWsMessage,
  updatePagePermissionInCache,
} from '@/features/pages/utils'
import type { PageId } from '@dotion/shared/pages/types'
import type { PagePermissionRole } from '@/features/pages/types'
import {
  handleMemberJoinedWsMessage,
  handleMemberRemovedWsMessage,
  handleInvitationCreatedWsMessage,
  handleInvitationDeclinedWsMessage,
  handleInvitationCancelledWsMessage,
} from '../utils'
import { workspacesListQueryOptions } from '../query-options'
import {
  pageDetailQueryOptions,
  trashedPagesQueryOptions,
} from '@/features/pages/query-options'
import { m } from '@/paraglide/messages'

export const useWorkspaceRealtime = () => {
  const { workspaceId, subscribe } = useWorkspaceWsContext()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams({ strict: false }) as { pageId?: string }
  const activePageIdRef = useRef(params.pageId)

  useEffect(() => {
    activePageIdRef.current = params.pageId
  }, [params.pageId])

  useEffect(() => {
    const unsubscribe = subscribe(({ payload: data, source }) => {
      if (source !== 'websocket') {
        return
      }
      switch (data.type) {
        case 'page.created': {
          handlePageAddedWsMessage({ queryClient, payload: data.payload })
          break
        }
        case 'page.moved_to_trash': {
          handlePageMovedToTrashWsMessage({
            queryClient,
            payload: data.payload,
          })
          const activePageId = activePageIdRef.current
          const isMoved =
            activePageId &&
            (activePageId === data.payload.pageId ||
              data.payload.pageIds?.includes(activePageId as PageId))
          if (isMoved) {
            navigate({
              to: '/app/workspaces/$workspaceId',
              params: { workspaceId: data.payload.workspaceId },
            })
            toast.info(m.toast_page_moved_to_trash())
          }
          break
        }
        case 'page.restored': {
          handlePageRestoredWsMessage({ queryClient, payload: data.payload })
          break
        }
        case 'page.deleted_permanently': {
          handlePageDeletedPermanentlyWsMessage({
            queryClient,
            payload: data.payload,
          })
          const activePageId = activePageIdRef.current
          const isDeleted =
            activePageId &&
            (activePageId === data.payload.pageId ||
              data.payload.pageIds?.includes(activePageId as PageId))
          if (isDeleted) {
            navigate({
              to: '/app/workspaces/$workspaceId/trash',
              params: { workspaceId: data.payload.workspaceId },
            })
            toast.info(m.toast_page_deleted_permanently())
          }
          break
        }
        case 'trash.emptied': {
          const activePageId = activePageIdRef.current
          let isCurrentlyOnTrashedPage = false
          if (activePageId) {
            const pageData = queryClient.getQueryData(
              pageDetailQueryOptions(
                data.payload.workspaceId,
                activePageId as PageId,
              ).queryKey,
            )
            const trashedPages = queryClient.getQueryData(
              trashedPagesQueryOptions(data.payload.workspaceId).queryKey,
            )
            if (
              pageData?.inTrash ||
              trashedPages?.some((p) => p.id === activePageId)
            ) {
              isCurrentlyOnTrashedPage = true
            }
          }

          handleTrashEmptiedWsMessage({ queryClient, payload: data.payload })

          if (isCurrentlyOnTrashedPage && activePageId) {
            queryClient.removeQueries({
              queryKey: pageDetailQueryOptions(
                data.payload.workspaceId,
                activePageId as PageId,
              ).queryKey,
            })
            navigate({
              to: '/app/workspaces/$workspaceId/trash',
              params: { workspaceId: data.payload.workspaceId },
            })
            toast.info(m.toast_trash_emptied())
          }
          break
        }
        case 'document.title.changed': {
          handleDocumentTitleChangedWsMessage({
            queryClient,
            payload: data.payload,
          })
          break
        }
        case 'document.icon.changed': {
          handleDocumentIconChangedWsMessage({
            queryClient,
            payload: data.payload,
          })
          break
        }
        case 'document.cover.changed': {
          handleDocumentCoverChangedWsMessage({
            queryClient,
            payload: data.payload,
          })
          break
        }
        case 'page.permission_updated': {
          updatePagePermissionInCache({
            queryClient,
            workspaceId: data.payload.workspaceId,
            pageId: data.payload.pageId,
            userId: data.payload.userId,
            role: data.payload.role as PagePermissionRole,
          })
          break
        }
        case 'workspace.invitation_created': {
          handleInvitationCreatedWsMessage({
            queryClient,
            payload: data.payload,
          })
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
          handleInvitationDeclinedWsMessage({
            queryClient,
            payload: data.payload,
          })
          toast.info(m.toast_workspace_invitation_declined())
          break
        }
        case 'workspace.invitation_cancelled': {
          handleInvitationCancelledWsMessage({
            queryClient,
            payload: data.payload,
          })
          toast.info(m.toast_workspace_invitation_cancelled())
          break
        }
        case 'workspace.member_joined': {
          handleMemberJoinedWsMessage({
            queryClient,
            workspaceId,
            payload: data.payload,
          })
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
            queryClient.setQueryData(
              workspacesListQueryOptions().queryKey,
              (old) => old?.filter((w) => w.id !== workspaceId),
            )
            navigate({ to: '/app/workspaces' })
          } else {
            handleMemberRemovedWsMessage({
              queryClient,
              payload: data.payload,
            })
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
