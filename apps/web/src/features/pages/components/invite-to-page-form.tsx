import { useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PagePermissionRole } from '../types'
import * as m from '@/paraglide/messages'

interface InviteToPageFormProps {
  onInvite: (email: string, role: PagePermissionRole) => void
  isSubmitting: boolean
  errorMessage?: string
}

export function InviteToPageForm({
  onInvite,
  isSubmitting,
  errorMessage,
}: InviteToPageFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<PagePermissionRole>('editor')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return
    onInvite(email.trim(), role)
    setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Input
          type="email"
          placeholder={m.auth_email()}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-8 flex-1 text-sm"
        />
        <Select
          value={role}
          onValueChange={(value) => setRole(value as PagePermissionRole)}
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">{m.workspace_role_viewer()}</SelectItem>
            <SelectItem value="commenter">{m.page_role_commenter()}</SelectItem>
            <SelectItem value="editor">{m.page_role_editor()}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={isSubmitting || !email.trim()}>
        {isSubmitting ? m.page_share_inviting() : m.page_share_invite()}
      </Button>
    </form>
  )
}
