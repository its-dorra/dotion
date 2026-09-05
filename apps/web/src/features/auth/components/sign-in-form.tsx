import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAppForm } from '@/integrations/tanstack-form/form'
import type { SignInSchemaType } from '../types'
import { SignInSchema } from '../schema'
import { useSignIn } from '../hooks/use-sign-in'
import * as m from '@/paraglide/messages'

export default function SignInForm() {
  const signInMutation = useSignIn()

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    } as SignInSchemaType,
    validators: {
      onSubmit: SignInSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await signInMutation.mutateAsync(
        {
          method: 'email',
          data: { email: value.email, password: value.password },
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
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field name="email">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{m.auth_email()}</FieldLabel>

            <Input
              id={field.name}
              name={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="dorra@dotion.com"
              autoComplete="email"
            />

            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{m.auth_password()}</FieldLabel>

            <Input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.AppForm>
        <form.SubscribeButton className="w-full">
          {m.auth_sign_in()}
        </form.SubscribeButton>
      </form.AppForm>

      {signInMutation.isError && (
        <div className="text-sm text-red-500">
          {signInMutation.error instanceof Error
            ? signInMutation.error.message
            : 'An unknown error occurred'}
        </div>
      )}
    </form>
  )
}
