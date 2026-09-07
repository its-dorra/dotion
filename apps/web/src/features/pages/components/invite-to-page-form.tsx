import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppForm } from '@/integrations/tanstack-form/form'
import { useInviteToPage } from '../hooks/use-invite-to-page'
import type { PagePermissionRole } from '../types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'
import * as m from '@/paraglide/messages'

const inviteToPageSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(['viewer', 'commenter', 'editor']),
})

interface InviteToPageFormProps {
  workspaceId: WorkspaceId
  pageId: PageId
}

export function InviteToPageForm({
  workspaceId,
  pageId,
}: InviteToPageFormProps) {
  const inviteToPage = useInviteToPage()

  const form = useAppForm({
    defaultValues: {
      email: '',
      role: 'editor' as PagePermissionRole,
    },
    validators: {
      onSubmit: inviteToPageSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await inviteToPage.mutateAsync(
        {
          workspaceId,
          pageId,
          email: value.email.trim(),
          role: value.role,
        },
        {
          onSuccess: () => {
            formApi.reset()
          },
        },
      )
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex gap-1.5">
        <form.Field name="email">
          {(field) => (
            <div className="flex-1">
              <Input
                type="email"
                placeholder={m.auth_email()}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="h-8 text-sm"
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="role">
          {(field) => (
            <Select
              value={field.state.value}
              onValueChange={(value) =>
                field.handleChange(value as PagePermissionRole)
              }
            >
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  {m.workspace_role_viewer()}
                </SelectItem>
                <SelectItem value="commenter">
                  {m.page_role_commenter()}
                </SelectItem>
                <SelectItem value="editor">{m.page_role_editor()}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </form.Field>
      </div>

      {inviteToPage.error?.message ? (
        <p className="text-xs text-destructive">{inviteToPage.error.message}</p>
      ) : null}

      <form.AppForm>
        <form.SubscribeButton size="sm">
          {m.page_share_invite()}
        </form.SubscribeButton>
      </form.AppForm>
    </form>
  )
}
