import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import {
  type DocumentBackgroundPreset,
  type BackgroundPresetConfig,
  type DocumentBackgroundColor,
  type BackgroundColorConfig,
  getBackgroundPresetConfig,
  getBackgroundColorConfig,
  PRESET_MAP,
  COLOR_MAP,
} from '@/features/pages/lib/document-background'

interface DocumentBackgroundState {
  background: DocumentBackgroundPreset
  backgroundColor: DocumentBackgroundColor
  setBackground: (preset: DocumentBackgroundPreset) => void
  setBackgroundColor: (color: DocumentBackgroundColor) => void
  presetConfig: BackgroundPresetConfig
  colorConfig: BackgroundColorConfig
}

const DocumentBackgroundContext = createContext<DocumentBackgroundState>({
  background: 'none',
  backgroundColor: 'default',
  setBackground: () => {},
  setBackgroundColor: () => {},
  presetConfig: getBackgroundPresetConfig('none'),
  colorConfig: getBackgroundColorConfig('default'),
})

interface DocumentBackgroundProviderProps {
  children: React.ReactNode
  defaultBackground?: DocumentBackgroundPreset
  defaultColor?: DocumentBackgroundColor
  storageKey?: string
  colorStorageKey?: string
}

export function DocumentBackgroundProvider({
  children,
  defaultBackground = 'none',
  defaultColor = 'default',
  storageKey = 'dotion_doc_background',
  colorStorageKey = 'dotion_doc_background_color',
}: DocumentBackgroundProviderProps) {
  const [background, setBackgroundState] =
    useState<DocumentBackgroundPreset>(defaultBackground)
  const [backgroundColor, setBackgroundColorState] =
    useState<DocumentBackgroundColor>(defaultColor)

  useEffect(() => {
    try {
      const storedPreset = localStorage.getItem(
        storageKey,
      ) as DocumentBackgroundPreset | null
      if (storedPreset && PRESET_MAP.has(storedPreset)) {
        setBackgroundState(storedPreset)
      }

      const storedColor = localStorage.getItem(
        colorStorageKey,
      ) as DocumentBackgroundColor | null
      if (storedColor && COLOR_MAP.has(storedColor)) {
        setBackgroundColorState(storedColor)
      }
    } catch {
      // Ignore localStorage errors (e.g. private browsing mode)
    }
  }, [storageKey, colorStorageKey])

  const setBackground = (preset: DocumentBackgroundPreset) => {
    try {
      localStorage.setItem(storageKey, preset)
    } catch {
      // Ignore
    }
    setBackgroundState(preset)
  }

  const setBackgroundColor = (color: DocumentBackgroundColor) => {
    try {
      localStorage.setItem(colorStorageKey, color)
    } catch {
      // Ignore
    }
    setBackgroundColorState(color)
  }

  const presetConfig = useMemo(
    () => getBackgroundPresetConfig(background),
    [background],
  )

  const colorConfig = useMemo(
    () => getBackgroundColorConfig(backgroundColor),
    [backgroundColor],
  )

  const value = useMemo(
    () => ({
      background,
      backgroundColor,
      setBackground,
      setBackgroundColor,
      presetConfig,
      colorConfig,
    }),
    [background, backgroundColor, presetConfig, colorConfig],
  )

  return (
    <DocumentBackgroundContext value={value}>
      {children}
    </DocumentBackgroundContext>
  )
}

export function useDocumentBackground() {
  const context = useContext(DocumentBackgroundContext)
  if (!context) {
    throw new Error(
      'useDocumentBackground must be used within a DocumentBackgroundProvider',
    )
  }
  return context
}
