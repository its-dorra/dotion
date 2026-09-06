import { useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateWorkspace } from '../hooks/use-create-workspace'
import * as m from '@/paraglide/messages'

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setName('')
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{m.workspace_create()}</DialogTitle>
            <DialogDescription>
              {m.workspace_selection_empty_desc()}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label htmlFor="workspace-name">
              {m.workspace_settings_title()}
            </Label>
            <Input
              id="workspace-name"
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
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {m.common_cancel()}
            </Button>
            <Button
              type="submit"
              disabled={createWorkspace.isPending || !name.trim()}
            >
              {m.workspace_create()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
