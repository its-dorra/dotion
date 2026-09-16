import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import type { UserSearchResult } from '../types'
import { m } from '@/paraglide/messages'

interface InviteMemberSearchResultsProps {
  isOpen: boolean
  searchTerm: string
  isPending: boolean
  searchResults: UserSearchResult[]
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
  isEmailInput: boolean
  onSelectUser: (user: UserSearchResult) => void
  onInviteEmail: () => void
}

export function InviteMemberSearchResults({
  isOpen,
  searchTerm,
  isPending,
  searchResults,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isEmailInput,
  onSelectUser,
  onInviteEmail,
}: InviteMemberSearchResultsProps) {
  if (!isOpen || searchTerm.trim().length === 0) {
    return null
  }

  return (
    <div className="max-h-64 overflow-y-auto p-1">
      {isPending ? (
        <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>{m.invite_form_searching()}</span>
        </div>
      ) : searchResults.length > 0 ? (
        <>
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
              <Avatar className="h-8 w-8">
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
              <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
          <InfiniteScroll
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            loadingText={m.invite_form_loading_more()}
            loadMoreText={m.invite_form_load_more()}
            showButtonFallback
          />
        </>
      ) : isEmailInput ? (
        <div
          onClick={onInviteEmail}
          className="flex cursor-pointer items-center gap-2.5 rounded-md p-2.5 text-left text-xs transition-colors hover:bg-accent"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {m.invite_form_invite_email({ email: searchTerm.trim() })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {m.invite_form_send_email_desc()}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-xs text-muted-foreground">
          {m.invite_form_no_users()}
        </div>
      )}
    </div>
  )
}
