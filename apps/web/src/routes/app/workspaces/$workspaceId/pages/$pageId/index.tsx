import { createFileRoute, notFound } from '@tanstack/react-router'
import { PageDetail } from '@/features/pages/components/page-detail'
import { PageDetailLoading } from '@/features/pages/components/page-detail-loading'
import { pageDetailQueryOptions } from '@/features/pages/query-options'
import { workspaceDetailQueryOptions } from '@/features/workspaces/query-options'
import { commentsInfiniteQueryOptions } from '@/features/comments/query-options'
import { canQueryOptions } from '@/features/authorization/query-options'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'
import { PageNotFoundError } from '@/features/pages/errors'
import { NotFoundError } from '@/lib/errors'
import { PageDetailError } from '@/features/pages/components/page-detail-error'
import { PageNotFound } from '@/features/pages/components/page-not-found'

export const Route = createFileRoute(
  '/app/workspaces/$workspaceId/pages/$pageId/',
)({
  loader: async ({ context: { queryClient }, params }) => {
    try {
      await queryClient.ensureQueryData(
        pageDetailQueryOptions(
          params.workspaceId as WorkspaceId,
          params.pageId as PageId,
        ),
      )
    } catch (error) {
      if (PageNotFoundError.is(error) || NotFoundError.is(error)) {
        throw notFound()
      }
      throw error
    }

    void queryClient.prefetchQuery(
      workspaceDetailQueryOptions(params.workspaceId as WorkspaceId),
    )
    void queryClient.prefetchInfiniteQuery(
      commentsInfiniteQueryOptions(
        params.workspaceId as WorkspaceId,
        params.pageId as PageId,
      ),
    )
    void queryClient.prefetchQuery(
      canQueryOptions({
        resource: {
          type: 'page',
          id: {
            pageId: params.pageId as PageId,
          },
        },
        action: 'update',
      }),
    )
    void queryClient.prefetchQuery(
      canQueryOptions({
        resource: {
          type: 'page',
          id: {
            pageId: params.pageId as PageId,
          },
        },
        action: 'delete',
      }),
    )
  },
  component: PagePage,
  errorComponent: PageDetailError,
  notFoundComponent: PageNotFound,
  pendingComponent: PageDetailLoading,
  pendingMinMs: 500,
})

function PagePage() {
  const { workspaceId, pageId } = Route.useParams()

  return (
    <PageDetail
      workspaceId={workspaceId as WorkspaceId}
      pageId={pageId as PageId}
    />
  )
}
