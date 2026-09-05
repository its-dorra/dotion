import { Button } from '../ui/button'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { getLocale, setLocale, type Locale } from '@/paraglide/runtime'
import { cn } from '@/lib/utils'

interface LanguageOption {
  id: Locale
  label: string
  code: string
}

const LANGUAGES: LanguageOption[] = [
  { id: 'en', label: 'English', code: 'EN' },
  { id: 'fr', label: 'Français', code: 'FR' },
  { id: 'ar', label: 'العربية', code: 'AR' },
]

interface LanguageToggleProps {
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

export default function LanguageToggle({
  className,
  side = 'bottom',
  align = 'end',
}: LanguageToggleProps) {
  const currentLocale = getLocale()
  const activeLanguage =
    LANGUAGES.find((lang) => lang.id === currentLocale) ?? LANGUAGES[0]!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground',
            className,
          )}
          aria-label="Select language"
        >
          <Globe className="h-3.75 w-3.75" />
          <span className="text-[13px] font-medium">{activeLanguage.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-40">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.id}
            onClick={() => {
              if (lang.id !== currentLocale) {
                setLocale(lang.id)
              }
            }}
            className="justify-between text-[13px] cursor-pointer"
          >
            <span>{lang.label}</span>
            {lang.id === currentLocale && (
              <span className="text-muted-foreground font-semibold">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
