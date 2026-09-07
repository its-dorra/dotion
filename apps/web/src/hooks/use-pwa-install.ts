import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export interface UsePwaInstallReturn {
  canInstall: boolean
  isInstalled: boolean
  isIos: boolean
  showIosGuide: boolean
  setShowIosGuide: (show: boolean) => void
  promptInstall: () => Promise<boolean>
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  const isIos =
    typeof window !== 'undefined' &&
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) &&
    !(window as unknown as { MSStream?: unknown }).MSStream

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia(
        '(display-mode: standalone)',
      ).matches
      const isNavigatorStandalone =
        (navigator as unknown as { standalone?: boolean }).standalone === true

      return isStandaloneMedia || isNavigatorStandalone
    }

    setIsInstalled(checkStandalone())

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowIosGuide(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstalled(true)
        return true
      }
      return false
    }

    if (isIos) {
      setShowIosGuide(true)
      return false
    }

    return false
  }, [deferredPrompt, isIos])

  return {
    canInstall: Boolean(deferredPrompt),
    isInstalled,
    isIos,
    showIosGuide,
    setShowIosGuide,
    promptInstall,
  }
}
