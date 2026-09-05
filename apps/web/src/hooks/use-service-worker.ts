import { useEffect, useState, useCallback, useRef } from 'react'

export interface UseServiceWorkerReturn {
  isRegistered: boolean
  updateAvailable: boolean
  updateServiceWorker: () => void
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isRegistered, setIsRegistered] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const refreshingRef = useRef(false)

  const updateServiceWorker = useCallback(() => {
    const reg = registrationRef.current
    if (!reg || !reg.waiting) return

    // Tell the waiting worker to activate immediately
    reg.waiting.postMessage({ type: 'SKIP_WAITING' })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Handle page reload once new SW has activated and taken control
    const handleControllerChange = () => {
      if (refreshingRef.current) return
      refreshingRef.current = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange,
    )

    // Register custom Service Worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registrationRef.current = registration
        setIsRegistered(true)

        // If there's already a waiting worker, flag update available
        if (registration.waiting) {
          setUpdateAvailable(true)
          return
        }

        // Listen for new service worker installation
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New update installed and ready to take over
              setUpdateAvailable(true)
            }
          })
        })
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error)
      })

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange,
      )
    }
  }, [])

  return {
    isRegistered,
    updateAvailable,
    updateServiceWorker,
  }
}
