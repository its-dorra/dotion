import { useParams } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { pagesKeys } from '../query-options'
import type { Page, PageTreeNode } from '../types'

export function PageDetailLoading() {
  const params = useParams({ strict: false }) as {
    workspaceId?: string
    pageId?: string
  }
  const queryClient = useQueryClient()

  const cachedPage = params.pageId
    ? queryClient.getQueryData<Page>(pagesKeys.detail(params.pageId))
    : undefined

  const tree = params.workspaceId
    ? queryClient.getQueryData<PageTreeNode[]>(
        pagesKeys.tree(params.workspaceId),
      )
    : undefined

  const cachedNode =
    params.pageId && tree
      ? tree.find((node) => node.id === params.pageId)
      : undefined

  const hasCover = Boolean(cachedPage?.cover)
  const hasIcon = Boolean(cachedPage?.icon ?? cachedNode?.icon)
  const icon = cachedPage?.icon ?? cachedNode?.icon ?? null

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
        </div>
        <div className="flex shrink-0 items-center gap-3 ms-auto">
          <div className="flex items-center gap-2">
            <Skeleton className="hidden h-4 w-24 sm:inline-block" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-18 rounded-md" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-y-auto">
        <div className="flex-1 min-h-full">
          <div className="group relative">
            {hasCover ? (
              <div className="relative h-48 w-full overflow-hidden sm:h-64 select-none bg-muted">
                {cachedPage?.cover ? (
                  <img
                    src={cachedPage.cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Skeleton className="h-full w-full rounded-none" />
                )}
              </div>
            ) : null}

            <div
              className={`mx-auto max-w-3xl px-4 sm:px-12 ${hasCover ? 'pt-0' : 'pt-6 sm:pt-12'}`}
            >
              {!hasIcon || !hasCover ? (
                <div
                  className={`flex items-center gap-1 opacity-100 sm:opacity-0 ${
                    hasCover ? 'pt-2 pb-1' : 'mb-2'
                  }`}
                >
                  {!hasIcon ? (
                    <div className="h-7 w-20 rounded-md bg-muted/40 sm:bg-transparent" />
                  ) : null}
                  {!hasCover ? (
                    <div className="h-7 w-22 rounded-md bg-muted/40 sm:bg-transparent" />
                  ) : null}
                </div>
              ) : null}

              {hasIcon ? (
                <div
                  className={
                    hasCover
                      ? '-mt-10 mb-2 relative z-10 inline-block'
                      : 'mb-2 inline-block'
                  }
                >
                  {icon ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-5xl leading-none select-none">
                      {icon}
                    </div>
                  ) : (
                    <Skeleton className="h-16 w-16 rounded-xl" />
                  )}
                </div>
              ) : null}

              <div className="mt-1">
                <Skeleton className="h-11 w-2/3 max-w-md rounded-md" />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-3xl px-12 pb-32 pt-4">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
