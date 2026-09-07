import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { useOnlineStatus } from '@/hooks/use-online-status'
import * as m from '@/paraglide/messages'

export function PwaManager() {
  const { updateAvailable, updateServiceWorker } = useServiceWorker()
  const isOnline = useOnlineStatus()
  const wasOnlineRef = useRef(isOnline)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (updateAvailable) {
      toast(m.pwa_update_available(), {
        id: 'pwa-update-available',
        duration: Infinity,
        action: {
          label: m.pwa_update_button(),
          onClick: () => updateServiceWorker(),
        },
      })
    }
  }, [updateAvailable, updateServiceWorker])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      wasOnlineRef.current = isOnline
      return
    }

    if (!isOnline && wasOnlineRef.current) {
      toast.warning(m.pwa_offline_warning(), {
        id: 'pwa-network-status',
        duration: 5000,
      })
    } else if (isOnline && !wasOnlineRef.current) {
      toast.success(m.pwa_online_restored(), {
        id: 'pwa-network-status',
        duration: 4000,
      })
    }

    wasOnlineRef.current = isOnline
  }, [isOnline])

  return null
}
