import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useSession } from '../hooks/use-session'
import { useUpdateUser } from '../hooks/use-update-user'
import { useAppForm } from '@/integrations/tanstack-form/form'
import { DocumentBackgroundPicker } from '@/features/pages/components/document-background-picker'
import { m } from '@/paraglide/messages'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Profile() {
  const { data: session } = useSession()
  const user = session?.user
  const updateUserMutation = useUpdateUser()

  const form = useAppForm({
    defaultValues: {
      name: user?.name ?? '',
    },
    onSubmit: async ({ value }) => {
      await updateUserMutation.mutateAsync({
        name: value.name.trim(),
      })
    },
  })

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground md:hidden" />
        <h1 className="text-2xl font-semibold tracking-tight">
          {m.auth_profile()}
        </h1>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className="text-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{m.auth_profile_photo()}</p>
            <p className="text-sm text-muted-foreground">
              {m.auth_photo_upload_unavailable()}
            </p>
          </div>
        </div>

        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="profile-name">{m.auth_name()}</Label>
              <Input
                id="profile-name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </div>
          )}
        </form.Field>

        <div className="space-y-2">
          <Label htmlFor="profile-email">{m.auth_email()}</Label>
          <Input id="profile-email" value={user.email} disabled />
        </div>

        <form.AppForm>
          <form.Subscribe
            selector={(state) => ({
              name: state.values.name,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ name, isSubmitting }) => {
              const hasChanges = Boolean(
                user && name?.trim() !== '' && name?.trim() !== user.name
              )
              return (
                <form.SubscribeButton disabled={!hasChanges || isSubmitting}>
                  {m.auth_save_changes()}
                </form.SubscribeButton>
              )
            }}
          </form.Subscribe>
        </form.AppForm>
      </form>

      <Separator className="my-10" />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium tracking-tight">
            {m.settings_document_background_title()}
          </h2>
          <p className="text-sm text-muted-foreground">
            {m.settings_document_background_desc()}
          </p>
        </div>
        <DocumentBackgroundPicker />
      </div>
    </div>
  )
}
