import { CheckCircle2, Loader2 } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import { workspaceCandidateUsersInfiniteQueryOptions } from '../query-options'
import type { UserSearchResult } from '../types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import { m } from '@/paraglide/messages'

interface InviteMemberSearchResultsProps {
  workspaceId: WorkspaceId
  searchTerm: string
  onSelectUser: (user: UserSearchResult) => void
}

export function InviteMemberSearchResults({
  workspaceId,
  searchTerm,
  onSelectUser,
}: InviteMemberSearchResultsProps) {
  const [debouncedSearch] = useDebouncedValue(searchTerm.trim(), { wait: 250 })

  const searchQuery = useInfiniteQuery(
    workspaceCandidateUsersInfiniteQueryOptions({
      query: debouncedSearch,
      workspaceId,
    }),
  )

  const searchResults =
    searchQuery.data?.pages.flatMap((page) => page.payload) ?? []

  if (searchQuery.isPending) {
    return (
      <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>{m.invite_form_searching()}</span>
      </div>
    )
  }

  if (searchResults.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        {m.invite_form_no_users()}
      </div>
    )
  }

  return (
    <div className="max-h-64 overflow-y-auto p-1">
      <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
        {m.invite_form_registered_users()}
      </div>
      {searchResults.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelectUser(user)}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
        >
          <Avatar className="h-8 w-8 shrink-0">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : null}
            <AvatarFallback className="text-xs">
              {user.name?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user.email}
            </p>
          </div>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100" />
        </button>
      ))}
      <InfiniteScroll
        hasNextPage={searchQuery.hasNextPage}
        fetchNextPage={searchQuery.fetchNextPage}
        isFetchingNextPage={searchQuery.isFetchingNextPage}
        loadingText={m.invite_form_loading_more()}
        loadMoreText={m.invite_form_load_more()}
        showButtonFallback
      />
    </div>
  )
}
