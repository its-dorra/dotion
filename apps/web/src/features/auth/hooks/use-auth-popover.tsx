import { createContext, useContext, useMemo, useState } from 'react'

export interface AuthPopoverContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  open: () => void
  close: () => void
}

const AuthPopoverContext = createContext<AuthPopoverContextValue | null>(null)

export function AuthPopoverProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen],
  )

  return (
    <AuthPopoverContext.Provider value={value}>
      {children}
    </AuthPopoverContext.Provider>
  )
}

export function useAuthPopover(): AuthPopoverContextValue {
  const context = useContext(AuthPopoverContext)
  if (!context) {
    throw new Error('useAuthPopover must be used within an AuthPopoverProvider')
  }
  return context
}
