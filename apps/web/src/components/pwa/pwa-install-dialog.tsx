import { Share, PlusSquare, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { m } from '@/paraglide/messages'

interface PwaInstallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PwaInstallDialog({
  open,
  onOpenChange,
}: PwaInstallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m.pwa_ios_install_title()}</DialogTitle>
          <DialogDescription>{m.pwa_ios_install_desc()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Share className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium">1. {m.pwa_ios_install_step1()}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <PlusSquare className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium">2. {m.pwa_ios_install_step2()}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Check className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium">3. {m.pwa_ios_install_step3()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
