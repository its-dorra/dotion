import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { CreateWorkspaceForm } from './create-workspace-form'
import { m } from '@/paraglide/messages'

interface CreateWorkspaceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceDrawer({
  open,
  onOpenChange,
}: CreateWorkspaceDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{m.workspace_create()}</DrawerTitle>
          <DrawerDescription>
            {m.workspace_selection_empty_desc()}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <CreateWorkspaceForm
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
