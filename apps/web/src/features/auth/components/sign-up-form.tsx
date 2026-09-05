import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAppForm } from '@/integrations/tanstack-form/form'
import type { SignUpSchemaType } from '../types'
import { SignUpSchema } from '../schema'
import { useSignUp } from '../hooks/use-sign-up'
import * as m from '@/paraglide/messages'

export default function SignUpForm() {
  const signUpMutation = useSignUp()

  const form = useAppForm({
    defaultValues: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    } as SignUpSchemaType,
    validators: {
      onSubmit: SignUpSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await signUpMutation.mutateAsync(
        {
          method: 'email',
          data: {
            email: value.email,
            name: value.name,
            password: value.password,
          },
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

      <form.Field name="name">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{m.auth_name()}</FieldLabel>

            <Input
              id={field.name}
              name={field.name}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Dorra"
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
            />

            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>
      <form.Field name="confirmPassword">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>
              {m.auth_confirm_password()}
            </FieldLabel>

            <Input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="••••••••"
            />

            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>
      <form.AppForm>
        <form.SubscribeButton className="w-full">
          {m.auth_create_account()}
        </form.SubscribeButton>
      </form.AppForm>

      {signUpMutation.isError && (
        <div className="text-sm text-red-500">
          {signUpMutation.error instanceof Error
            ? signUpMutation.error.message
            : 'An unknown error occurred'}
        </div>
      )}
    </form>
  )
}
