import { useState, useCallback } from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { pageDetailQueryOptions } from '../query-options'
import { workspaceDetailQueryOptions } from '@/features/workspaces/query-options'
import { canQueryOptions } from '@/features/authorization/query-options'
import { PageNavbar } from './page-navbar'
import { PageTrashBanner } from './page-trash-banner'
import { PageHeader } from './page-header'
import { PageEditor } from './page-editor'
import { CommentsSidebar } from '@/features/comments/components/comments-sidebar'
import { CommentsSheet } from '@/features/comments/components/comments-sheet'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/features/auth/hooks/use-session'
import { usePageYjs } from '../hooks/use-page-yjs'
import { usePageAwareness } from '../hooks/use-page-awareness'
import { usePageCommentsRealtime } from '@/features/comments/hooks/use-page-comments-realtime'
import { useUpdatePageMetadata } from '../hooks/use-update-page-metadata'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'

interface PageDetailProps {
  workspaceId: WorkspaceId
  pageId: PageId
  readOnly?: boolean
}

export function PageDetail({
  workspaceId,
  pageId,
  readOnly = false,
}: PageDetailProps) {
  const { data: page } = useSuspenseQuery(
    pageDetailQueryOptions(workspaceId, pageId),
  )
  const { data: workspace } = useSuspenseQuery(
    workspaceDetailQueryOptions(workspaceId),
  )

  const { provider, wsClient, synced } = usePageYjs(workspaceId, pageId)
  usePageCommentsRealtime({ workspaceId, pageId, wsClient })

  const session = useSession()
  const collaborators = usePageAwareness(provider, session.data?.user)
  const [isMobileCommentsOpen, setIsMobileCommentsOpen] = useState(false)
  const handleOpenComments = useCallback(
    () => setIsMobileCommentsOpen(true),
    [],
  )

  const { updateTitle, updateIcon, updateCover } = useUpdatePageMetadata({
    workspaceId,
    pageId: page.id,
    wsClient,
  })

  const { data: updatePerm } = useQuery(
    canQueryOptions({
      resource: { type: 'page', id: { pageId } },
      action: 'update',
    }),
  )
  const isEditor = updatePerm?.allowed ?? false

  const { data: commentPerm } = useQuery(
    canQueryOptions({
      resource: 'comment',
      action: 'create',
      scope: { pageId },
    }),
  )
  const canComment = commentPerm?.allowed ?? false

  const isReadOnly = Boolean(page.inTrash) || readOnly || !isEditor
  const effectiveCommentRole = page.inTrash
    ? 'viewer'
    : isEditor
      ? 'editor'
      : canComment
        ? 'commenter'
        : 'viewer'

  const editorReady = provider && synced

  return (
    <div className="flex h-full flex-col">
      <PageNavbar
        page={page}
        workspaceName={workspace.name}
        workspaceId={workspaceId}
        collaborators={collaborators}
        onOpenComments={handleOpenComments}
      />
      {page.inTrash && (
        <PageTrashBanner
          workspaceId={workspaceId}
          pageId={page.id}
          pageTitle={page.title ?? ''}
        />
      )}
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex-1 min-h-full">
          <PageHeader
            page={page}
            onTitleChange={updateTitle}
            onIconChange={updateIcon}
            onCoverChange={updateCover}
            readOnly={isReadOnly}
          />
          {editorReady ? (
            <PageEditor
              workspaceId={workspaceId}
              pageId={page.id}
              readOnly={isReadOnly}
              collaborationProvider={provider}
            />
          ) : (
            <div className="flex h-64 items-center justify-center">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          )}
        </div>
        <CommentsSidebar
          workspaceId={workspaceId}
          pageId={page.id}
          currentUserRole={effectiveCommentRole}
        />
        <CommentsSheet
          open={isMobileCommentsOpen}
          onOpenChange={setIsMobileCommentsOpen}
          workspaceId={workspaceId}
          pageId={page.id}
          currentUserRole={effectiveCommentRole}
        />
      </div>
    </div>
  )
}
