import { useState, type FormEvent } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateWorkspace } from '../hooks/use-create-workspace'
import * as m from '@/paraglide/messages'

interface CreateWorkspaceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDrawer({
  open,
  onOpenChange,
}: CreateWorkspaceDrawerProps) {
  const [name, setName] = useState('')
  const createWorkspace = useCreateWorkspace()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    await createWorkspace.mutateAsync({ name: trimmed, icon: null })
    setName('')
    onOpenChange(false)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) setName('')
        onOpenChange(next)
      }}
    >
      <DrawerContent>
        <form onSubmit={handleSubmit}>
          <DrawerHeader>
            <DrawerTitle>{m.workspace_create()}</DrawerTitle>
            <DrawerDescription>
              {m.workspace_selection_empty_desc()}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4">
            <Label htmlFor="workspace-name-mobile">
              {m.workspace_settings_title()}
            </Label>
            <Input
              id="workspace-name-mobile"
              autoFocus
              placeholder="Acme Inc"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {createWorkspace.error?.message ? (
              <p className="text-sm text-destructive">
                {createWorkspace.error.message}
              </p>
            ) : null}
          </div>
          <DrawerFooter>
            <Button
              type="submit"
              disabled={createWorkspace.isPending || !name.trim()}
            >
              {m.workspace_create()}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {m.common_cancel()}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
