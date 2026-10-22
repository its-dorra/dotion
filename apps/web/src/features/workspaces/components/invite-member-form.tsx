import { useRef, useState } from 'react'
import { Search, X, UserPlus, Loader2, Shield } from 'lucide-react'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { FieldError } from '@/components/ui/field'
import { useAppForm } from '@/integrations/tanstack-form/form'
import { useInviteMember } from '../hooks/use-invite-member'
import { InviteMemberSelectedUser } from './invite-member-selected-user'
import { InviteMemberSearchResults } from './invite-member-search-results'
import { m } from '@/paraglide/messages'
import type { UserSearchResult } from '../types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface InviteMemberFormProps {
  workspaceId: WorkspaceId
  onSuccess?: () => void
}

const inviteMemberSchema = z.object({
  selectedUser: z.custom<UserSearchResult | null>(
    (val) => val !== null && typeof val === 'object',
    { message: m.invite_form_search_placeholder() },
  ),
})

export function InviteMemberForm({
  workspaceId,
  onSuccess,
}: InviteMemberFormProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const inviteMember = useInviteMember()

  const form = useAppForm({
    defaultValues: {
      selectedUser: null as UserSearchResult | null,
    },
    validators: {
      onSubmit: inviteMemberSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const user = value.selectedUser
      if (!user) return

      await inviteMember.mutateAsync({
        workspaceId,
        userId: user.id,
        email: user.email,
      })

      formApi.reset()
      setSearchTerm('')
      setIsOpen(false)
      onSuccess?.()
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        form.handleSubmit()
      }}
      className="min-w-0 space-y-4"
    >
      <form.Field name="selectedUser">
        {(field) => {
          const selectedUser = field.state.value
          const showSearchResults =
            isOpen && !selectedUser && searchTerm.trim().length > 0

          function handleSelectUser(user: UserSearchResult) {
            field.handleChange(user)
            setSearchTerm('')
            setIsOpen(false)
          }

          function handleClearSelection() {
            field.handleChange(null)
            setSearchTerm('')
            inputRef.current?.focus()
          }

          return (
            <div className="min-w-0 space-y-1">
              <Popover open={showSearchResults} onOpenChange={setIsOpen}>
                <PopoverAnchor asChild>
                  <div className="relative min-w-0 w-full">
                    {selectedUser ? (
                      <InviteMemberSelectedUser
                        user={selectedUser}
                        onClear={handleClearSelection}
                      />
                    ) : (
                      <div className="relative min-w-0 w-full">
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
                          aria-expanded={showSearchResults}
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
                  </div>
                </PopoverAnchor>

                <PopoverContent
                  align="start"
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <InviteMemberSearchResults
                    workspaceId={workspaceId}
                    searchTerm={searchTerm}
                    onSelectUser={handleSelectUser}
                  />
                </PopoverContent>
              </Popover>

              <FieldError errors={field.state.meta.errors} />
            </div>
          )
        }}
      </form.Field>

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
        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values.selectedUser]}
        >
          {([isSubmitting, selectedUser]) => (
            <Button
              type="submit"
              disabled={Boolean(isSubmitting) || !selectedUser}
              className="gap-2"
            >
              {isSubmitting ? (
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
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
