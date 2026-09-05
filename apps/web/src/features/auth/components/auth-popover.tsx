import { User } from 'lucide-react'

import { AuthForm } from './auth-form'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAuthPopover } from '../hooks/use-auth-popover'

import * as m from '@/paraglide/messages'

interface AuthPopoverProps {
  children?: React.ReactNode
  align?: 'start' | 'center' | 'end'
}

export default function AuthPopover({
  children,
  align = 'end',
}: AuthPopoverProps) {
  const { isOpen, setIsOpen } = useAuthPopover()

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            aria-label={m.auth_sign_in()}
          >
            <User />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent align={align} className="w-[400px]">
        <AuthForm />
      </PopoverContent>
    </Popover>
  )
}
