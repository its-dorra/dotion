import LanguageToggle from './language-toggle'
import ThemeToggle from './theme-toggle'
import { Button } from '../ui/button'
import DotionMark from './dotion-mark'
import AuthButton from '@/features/auth/components/auth-button'
import * as m from '@/paraglide/messages'

export default function Navbar() {
  const navItems = [
    { label: m.nav_product() },
    { label: m.nav_templates() },
    { label: m.nav_docs() },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <DotionMark />
          <span className="text-[15px] font-semibold tracking-tight">
            Dotion
          </span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Button>
          ))}
        </nav>

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
