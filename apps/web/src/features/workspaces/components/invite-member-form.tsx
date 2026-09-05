import { useState, useRef, useEffect, type FormEvent } from 'react'
import {
  Search,
  X,
  UserPlus,
  Loader2,
  Mail,
  CheckCircle2,
  Shield,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import { useInfiniteQuery } from '@tanstack/react-query'
import { workspaceCandidateUsersInfiniteQueryOptions } from '../query-options'
import { useInviteMember } from '../hooks/use-invite-member'
import * as m from '@/paraglide/messages'
import type { UserSearchResult } from '@dotion/shared/users/types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface InviteMemberFormProps {
  workspaceId: string
  onSuccess?: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function InviteMemberForm({
  workspaceId,
  onSuccess,
}: InviteMemberFormProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  )
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const inviteMember = useInviteMember()

  const searchQuery = useInfiniteQuery(
    workspaceCandidateUsersInfiniteQueryOptions({
      query: searchTerm.trim(),
      workspaceId,
    }),
  )

  const searchResults =
    searchQuery.data?.pages.flatMap((page) => page.payload) ?? []

  const isEmailInput = EMAIL_REGEX.test(searchTerm.trim())

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    if (selectedUser) {
      try {
        await inviteMember.mutateAsync({
          workspaceId: workspaceId as WorkspaceId,
          userId: selectedUser.id as any,
          email: selectedUser.email,
        })
        setSelectedUser(null)
        setSearchTerm('')
        setIsOpen(false)
        onSuccess?.()
      } catch {
        // handled by mutation hook
      }
      return
    }

    const trimmed = searchTerm.trim()
    if (!trimmed) return
    try {
      await inviteMember.mutateAsync({
        workspaceId: workspaceId as WorkspaceId,
        email: trimmed,
      })
      setSearchTerm('')
      setIsOpen(false)
      onSuccess?.()
    } catch {
      // handled by mutation hook
    }
  }

  function handleSelectUser(user: UserSearchResult) {
    setSelectedUser(user)
    setSearchTerm('')
    setIsOpen(false)
  }

  function handleClearSelection() {
    setSelectedUser(null)
    setSearchTerm('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div ref={containerRef} className="relative">
        {selectedUser ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 border border-primary/30">
                {selectedUser.image ? (
                  <AvatarImage
                    src={selectedUser.image}
                    alt={selectedUser.name}
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {selectedUser.name?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {selectedUser.name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-normal"
                  >
                    {m.workspace_role_member()}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {selectedUser.email}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              {m.invite_form_change()}
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={m.invite_form_search_placeholder()}
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setIsOpen(true)
              }}
              onFocus={() => {
                if (searchTerm.trim().length > 0) setIsOpen(true)
              }}
              className="pl-9 pr-9 text-sm"
              aria-expanded={isOpen}
              autoComplete="off"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setIsOpen(false)
                  inputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        )}

        {isOpen && searchTerm.trim().length > 0 && !selectedUser ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
            {searchQuery.isPending ? (
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
                    onClick={() => handleSelectUser(user)}
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
                  hasNextPage={searchQuery.hasNextPage}
                  fetchNextPage={searchQuery.fetchNextPage}
                  isFetchingNextPage={searchQuery.isFetchingNextPage}
                  loadingText={m.invite_form_loading_more()}
                  loadMoreText={m.invite_form_load_more()}
                  showButtonFallback
                />
              </>
            ) : isEmailInput ? (
              <div
                onClick={handleSubmit}
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
              <div className="p-3 text-center text-xs text-muted-foreground">
                <p>{m.invite_form_no_users()}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  {m.invite_form_enter_email_desc()}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex items-start gap-2 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
        <span>{m.invite_form_role_notice()}</span>
      </div>

      {inviteMember.isError ? (
        <p className="rounded-md bg-destructive/10 p-2 text-xs font-medium text-destructive">
          {inviteMember.error.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            inviteMember.isPending || (!selectedUser && !searchTerm.trim())
          }
          className="gap-2"
        >
          {inviteMember.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{m.invite_form_sending()}</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>{m.invite_form_send()}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
