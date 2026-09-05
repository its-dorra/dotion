import { useEffect, useState } from 'react'
import type { PageYjsProvider } from '../lib/page-yjs-provider'

export interface CollaborativeUser {
  clientId: number
  name: string
  color: string
}

interface AwarenessUserState {
  user?: {
    name?: string
    color?: string
  }
}

export function usePageAwareness(
  provider: PageYjsProvider | null | undefined,
): CollaborativeUser[] {
  const [collaborators, setCollaborators] = useState<CollaborativeUser[]>([])

  useEffect(() => {
    if (!provider) {
      setCollaborators([])
      return
    }

    const awareness = provider.awareness
    const localClientId = provider.doc.clientID

    function updateCollaborators() {
      const states = awareness.getStates() as Map<number, AwarenessUserState>
      const users: CollaborativeUser[] = []

      states.forEach((state, clientId) => {
        if (clientId === localClientId) {
          return
        }

        if (state.user?.name && state.user?.color) {
          users.push({
            clientId,
            name: state.user.name,
            color: state.user.color,
          })
        }
      })

      setCollaborators(users)
    }

    updateCollaborators()

    awareness.on('change', updateCollaborators)

    return () => {
      awareness.off('change', updateCollaborators)
    }
  }, [provider])

  return collaborators
}
