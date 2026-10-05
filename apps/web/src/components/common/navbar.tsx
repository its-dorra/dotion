import LanguageToggle from './language-toggle'
import ThemeToggle from './theme-toggle'
import { Button } from '../ui/button'
import DotionMark from './dotion-mark'
import AuthButton from '@/features/auth/components/auth-button'
import { m } from '@/paraglide/messages'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <DotionMark />
          <span className="text-[15px] font-semibold tracking-tight">
            Dotion
          </span>
        </div>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <div className="mx-1 h-5 w-px bg-border" />

          <AuthButton />
        </div>
      </div>
    </header>
  )
}
