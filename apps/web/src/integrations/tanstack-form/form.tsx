import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext, useFormContext } from './form-context'
import { Button } from '@/components/ui/button'

function SubscribeButton({
  disabled,
  ...props
}: React.ComponentProps<typeof Button>) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button {...props} disabled={isSubmitting || disabled} />
      )}
    </form.Subscribe>
  )
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {},
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})
