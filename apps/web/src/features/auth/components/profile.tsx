import { useState, type FormEvent } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useSession } from '../hooks/use-session'
import { DocumentBackgroundPicker } from '@/features/pages/components/document-background-picker'
import * as m from '@/paraglide/messages'

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

  const [name, setName] = useState(user?.name ?? '')
  const hasChanges = Boolean(user && name.trim() !== user.name)

  if (!user) {
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!hasChanges) return
    // Profile save action
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground md:hidden" />
        <h1 className="text-2xl font-semibold tracking-tight">
          {m.auth_profile()}
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="space-y-2">
          <Label htmlFor="profile-name">{m.auth_name()}</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">{m.auth_email()}</Label>
          <Input id="profile-email" value={user.email} disabled />
          <p className="text-xs text-muted-foreground">
            {m.auth_email_change_notice()}
          </p>
        </div>

        <Button type="submit" disabled={!hasChanges}>
          {m.auth_save_changes()}
        </Button>
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
