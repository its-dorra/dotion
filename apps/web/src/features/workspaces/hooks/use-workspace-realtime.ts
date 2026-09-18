import type { QueryClient } from '@tanstack/react-query'
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
import type {
  WorkspaceId,
  WorkspaceWsMessage,
} from '@dotion/shared/workspaces/types'
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

interface WorkspaceWsHandlerContext {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  currentUserId?: string
  navigate: ReturnType<typeof useNavigate>
  activePageIdRef: React.MutableRefObject<string | undefined>
}

type WorkspaceWsStrategy<T extends WorkspaceWsMessage['type']> = (
  payload: Extract<WorkspaceWsMessage, { type: T }>['payload'],
  ctx: WorkspaceWsHandlerContext,
) => void

const WORKSPACE_WS_STRATEGIES: {
  [K in WorkspaceWsMessage['type']]: WorkspaceWsStrategy<K>
} = {
  'page.created': (payload, { queryClient }) => {
    handlePageAddedWsMessage({ queryClient, payload })
  },
  'page.moved_to_trash': (
    payload,
    { queryClient, navigate, activePageIdRef },
  ) => {
    handlePageMovedToTrashWsMessage({
      queryClient,
      payload,
    })
    const activePageId = activePageIdRef.current
    const isMoved =
      activePageId &&
      (activePageId === payload.pageId ||
        payload.pageIds?.includes(activePageId as PageId))
    if (isMoved) {
      navigate({
        to: '/app/workspaces/$workspaceId',
        params: { workspaceId: payload.workspaceId },
      })
      toast.info(m.toast_page_moved_to_trash())
    }
  },
  'page.restored': (payload, { queryClient }) => {
    handlePageRestoredWsMessage({ queryClient, payload })
  },
  'page.deleted_permanently': (
    payload,
    { queryClient, navigate, activePageIdRef },
  ) => {
    handlePageDeletedPermanentlyWsMessage({
      queryClient,
      payload,
    })
    const activePageId = activePageIdRef.current
    const isDeleted =
      activePageId &&
      (activePageId === payload.pageId ||
        payload.pageIds?.includes(activePageId as PageId))
    if (isDeleted) {
      navigate({
        to: '/app/workspaces/$workspaceId/trash',
        params: { workspaceId: payload.workspaceId },
      })
      toast.info(m.toast_page_deleted_permanently())
    }
  },
  'trash.emptied': (payload, { queryClient, navigate, activePageIdRef }) => {
    const activePageId = activePageIdRef.current
    let isCurrentlyOnTrashedPage = false
    if (activePageId) {
      const pageData = queryClient.getQueryData(
        pageDetailQueryOptions(payload.workspaceId, activePageId as PageId)
          .queryKey,
      )
      const trashedPages = queryClient.getQueryData(
        trashedPagesQueryOptions(payload.workspaceId).queryKey,
      )
      if (
        pageData?.inTrash ||
        trashedPages?.some((p) => p.id === activePageId)
      ) {
        isCurrentlyOnTrashedPage = true
      }
    }

    handleTrashEmptiedWsMessage({ queryClient, payload })

    if (isCurrentlyOnTrashedPage && activePageId) {
      queryClient.removeQueries({
        queryKey: pageDetailQueryOptions(
          payload.workspaceId,
          activePageId as PageId,
        ).queryKey,
      })
      navigate({
        to: '/app/workspaces/$workspaceId/trash',
        params: { workspaceId: payload.workspaceId },
      })
      toast.info(m.toast_trash_emptied())
    }
  },
  'document.title.changed': (payload, { queryClient }) => {
    handleDocumentTitleChangedWsMessage({
      queryClient,
      payload,
    })
  },
  'document.icon.changed': (payload, { queryClient }) => {
    handleDocumentIconChangedWsMessage({
      queryClient,
      payload,
    })
  },
  'document.cover.changed': (payload, { queryClient }) => {
    handleDocumentCoverChangedWsMessage({
      queryClient,
      payload,
    })
  },
  'page.permission_updated': (payload, { queryClient }) => {
    updatePagePermissionInCache({
      queryClient,
      workspaceId: payload.workspaceId,
      pageId: payload.pageId,
      userId: payload.userId,
      role: payload.role as PagePermissionRole,
    })
  },
  'workspace.invitation_created': (payload, { queryClient, currentUserId }) => {
    handleInvitationCreatedWsMessage({
      queryClient,
      payload,
    })
    if (payload.invitedByUserId !== currentUserId) {
      toast.info(
        m.toast_workspace_invited({
          email: payload.invitedUserEmail || payload.invitedUserName || 'user',
        }),
      )
    }
  },
  'workspace.invitation_declined': (payload, { queryClient }) => {
    handleInvitationDeclinedWsMessage({
      queryClient,
      payload,
    })
    toast.info(m.toast_workspace_invitation_declined())
  },
  'workspace.invitation_cancelled': (payload, { queryClient }) => {
    handleInvitationCancelledWsMessage({
      queryClient,
      payload,
    })
    toast.info(m.toast_workspace_invitation_cancelled())
  },
  'workspace.member_joined': (payload, { queryClient, workspaceId }) => {
    handleMemberJoinedWsMessage({
      queryClient,
      workspaceId,
      payload,
    })
    toast.info(
      m.toast_workspace_member_joined({
        name: payload.member.name,
      }),
    )
  },
  'workspace.member_removed': (
    payload,
    { queryClient, workspaceId, currentUserId, navigate },
  ) => {
    if (payload.userId === currentUserId) {
      toast.error(m.toast_workspace_removed())
      queryClient.setQueryData(workspacesListQueryOptions().queryKey, (old) =>
        old?.filter((w) => w.id !== workspaceId),
      )
      navigate({ to: '/app/workspaces' })
    } else {
      handleMemberRemovedWsMessage({
        queryClient,
        payload,
      })
      toast.info(m.toast_workspace_member_removed())
    }
  },
}

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
      const strategy = WORKSPACE_WS_STRATEGIES[data.type] as
        | WorkspaceWsStrategy<typeof data.type>
        | undefined
      if (strategy) {
        strategy(data.payload as never, {
          queryClient,
          workspaceId,
          currentUserId,
          navigate,
          activePageIdRef,
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [currentUserId, navigate, queryClient, subscribe, workspaceId])
}
