import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { ScriptOnce } from '@tanstack/react-router'
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

export interface DocumentBackgroundState {
  background: DocumentBackgroundPreset
  backgroundColor: DocumentBackgroundColor
  setBackground: (preset: DocumentBackgroundPreset) => void
  setBackgroundColor: (color: DocumentBackgroundColor) => void
  presetConfig: BackgroundPresetConfig
  colorConfig: BackgroundColorConfig
  mounted?: boolean
}

function getDocumentBackgroundScript(
  storageKey: string,
  colorStorageKey: string,
  defaultBackground: DocumentBackgroundPreset,
  defaultColor: DocumentBackgroundColor,
) {
  const bgKey = JSON.stringify(storageKey)
  const colorKey = JSON.stringify(colorStorageKey)
  const fallbackBg = JSON.stringify(defaultBackground)
  const fallbackColor = JSON.stringify(defaultColor)
  const validPresets = JSON.stringify(Array.from(PRESET_MAP.keys()))
  const validColors = JSON.stringify(Array.from(COLOR_MAP.keys()))

  return `(function(){try{var b=localStorage.getItem(${bgKey});var c=localStorage.getItem(${colorKey});var vp=${validPresets};var vc=${validColors};if(!vp.includes(b)){b=${fallbackBg}}if(!vc.includes(c)){c=${fallbackColor}}var e=document.documentElement;e.setAttribute('data-doc-bg-preset',b);e.setAttribute('data-doc-bg-color',c)}catch(e){}})();`
}

const DocumentBackgroundContext = createContext<DocumentBackgroundState>({
  background: 'none',
  backgroundColor: 'default',
  setBackground: () => {},
  setBackgroundColor: () => {},
  presetConfig: getBackgroundPresetConfig('none'),
  colorConfig: getBackgroundColorConfig('default'),
  mounted: false,
})

function applyDocumentBackground(
  preset: DocumentBackgroundPreset,
  color: DocumentBackgroundColor,
) {
  const root = document.documentElement
  root.setAttribute('data-doc-bg-preset', preset)
  root.setAttribute('data-doc-bg-color', color)
}

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

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        storageKey,
      ) as DocumentBackgroundPreset | null
      setBackgroundState(
        stored && PRESET_MAP.has(stored) ? stored : defaultBackground,
      )
    } catch {}

    try {
      const storedColor = localStorage.getItem(
        colorStorageKey,
      ) as DocumentBackgroundColor | null
      setBackgroundColorState(
        storedColor && COLOR_MAP.has(storedColor) ? storedColor : defaultColor,
      )
    } catch {}

    setMounted(true)
  }, [defaultBackground, defaultColor, storageKey, colorStorageKey])

  useEffect(() => {
    if (!mounted) return
    applyDocumentBackground(background, backgroundColor)
  }, [background, backgroundColor, mounted])

  const setBackground = useCallback(
    (preset: DocumentBackgroundPreset) => {
      try {
        localStorage.setItem(storageKey, preset)
      } catch {}
      setBackgroundState(preset)
    },
    [storageKey],
  )

  const setBackgroundColor = useCallback(
    (color: DocumentBackgroundColor) => {
      try {
        localStorage.setItem(colorStorageKey, color)
      } catch {}
      setBackgroundColorState(color)
    },
    [colorStorageKey],
  )

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
      mounted,
    }),
    [
      background,
      backgroundColor,
      setBackground,
      setBackgroundColor,
      presetConfig,
      colorConfig,
      mounted,
    ],
  )

  return (
    <DocumentBackgroundContext value={value}>
      <ScriptOnce>
        {getDocumentBackgroundScript(
          storageKey,
          colorStorageKey,
          defaultBackground,
          defaultColor,
        )}
      </ScriptOnce>
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
