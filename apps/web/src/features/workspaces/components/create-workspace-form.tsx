import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field'
import { useAppForm } from '@/integrations/tanstack-form/form'
import { useCreateWorkspace } from '../hooks/use-create-workspace'
import * as m from '@/paraglide/messages'

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'Workspace name is required').max(50),
})

interface CreateWorkspaceFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateWorkspaceForm({
  onSuccess,
  onCancel,
}: CreateWorkspaceFormProps) {
  const createWorkspace = useCreateWorkspace()

  const form = useAppForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onSubmit: createWorkspaceSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await createWorkspace.mutateAsync(
        { name: value.name.trim() },
        {
          onSuccess: () => {
            formApi.reset()
            onSuccess?.()
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
      className="space-y-4"
    >
      <form.Field name="name">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="create-workspace-name">
              {m.workspace_settings_title()}
            </Label>
            <Input
              id="create-workspace-name"
              autoFocus
              placeholder="Acme Inc"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      {createWorkspace.error?.message ? (
        <p className="text-sm text-destructive">
          {createWorkspace.error.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {m.common_cancel()}
          </Button>
        )}
        <form.AppForm>
          <form.SubscribeButton>{m.workspace_create()}</form.SubscribeButton>
        </form.AppForm>
      </div>
    </form>
  )
}
