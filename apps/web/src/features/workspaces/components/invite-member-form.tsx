import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Search, X, UserPlus, Loader2, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { workspaceCandidateUsersInfiniteQueryOptions } from '../query-options'
import { useInviteMember } from '../hooks/use-invite-member'
import { InviteMemberSelectedUser } from './invite-member-selected-user'
import { InviteMemberSearchResults } from './invite-member-search-results'
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

  const [debouncedSearch] = useDebouncedValue(searchTerm.trim(), { wait: 250 })

  const inviteMember = useInviteMember()

  const searchQuery = useInfiniteQuery(
    workspaceCandidateUsersInfiniteQueryOptions({
      query: debouncedSearch,
      workspaceId,
    }),
  )

  const searchResults =
    searchQuery.data?.pages.flatMap((page) => page.payload) ?? []

  const isEmailInput = EMAIL_REGEX.test(searchTerm.trim())

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
      await inviteMember.mutateAsync({
        workspaceId: workspaceId as WorkspaceId,
        userId: selectedUser.id as any,
        email: selectedUser.email,
      })
      setSelectedUser(null)
      setSearchTerm('')
      setIsOpen(false)
      onSuccess?.()
      return
    }

    const trimmed = searchTerm.trim()
    if (!trimmed) return
    await inviteMember.mutateAsync({
      workspaceId: workspaceId as WorkspaceId,
      email: trimmed,
    })
    setSearchTerm('')
    setIsOpen(false)
    onSuccess?.()
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
          <InviteMemberSelectedUser
            user={selectedUser}
            onClear={handleClearSelection}
          />
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

        <InviteMemberSearchResults
          isOpen={isOpen && !selectedUser}
          searchTerm={searchTerm}
          isPending={searchQuery.isPending}
          searchResults={searchResults}
          hasNextPage={searchQuery.hasNextPage}
          fetchNextPage={searchQuery.fetchNextPage}
          isFetchingNextPage={searchQuery.isFetchingNextPage}
          isEmailInput={isEmailInput}
          onSelectUser={handleSelectUser}
          onInviteEmail={() => handleSubmit()}
        />
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
