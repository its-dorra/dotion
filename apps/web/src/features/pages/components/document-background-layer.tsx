import { useDocumentBackground } from '@/components/common/document-background-provider'
import {
  type DocumentBackgroundPreset,
  type DocumentBackgroundColor,
  getBackgroundPresetConfig,
  getBackgroundColorConfig,
} from '../lib/document-background'
import { cn } from '@/lib/utils'

interface DocumentBackgroundLayerProps {
  /**
   * Optional preset override (if not provided, uses active preset from useDocumentBackground)
   */
  preset?: DocumentBackgroundPreset
  /**
   * Optional color override (if not provided, uses active color from useDocumentBackground)
   */
  color?: DocumentBackgroundColor
  className?: string
  opacity?: number
}

export function DocumentBackgroundLayer({
  preset,
  color,
  className,
  opacity,
}: DocumentBackgroundLayerProps) {
  const { presetConfig: activePresetConfig, colorConfig: activeColorConfig } =
    useDocumentBackground()

  const presetConfig = preset
    ? getBackgroundPresetConfig(preset)
    : activePresetConfig

  const colorConfig = color
    ? getBackgroundColorConfig(color)
    : activeColorConfig

  const hasPattern = presetConfig.id !== 'none' && Boolean(presetConfig.svgDataUri)
  const hasGlow = Boolean(colorConfig.glowClass)

  if (!hasPattern && !hasGlow) {
    return null
  }

  return (
    <>
      {/* Optional subtle ambient color wash */}
      {hasGlow && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-0 select-none transition-colors duration-500',
            colorConfig.glowClass,
          )}
          aria-hidden="true"
        />
      )}

      {/* Vector pattern layer with selected pattern color and light/dark opacity */}
      {hasPattern && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-0 select-none transition-all duration-300 opacity-[var(--doc-bg-op-light)] dark:opacity-[var(--doc-bg-op-dark)]',
            colorConfig.patternClass,
            className,
          )}
          style={{
            maskImage: `url("${presetConfig.svgDataUri}")`,
            WebkitMaskImage: `url("${presetConfig.svgDataUri}")`,
            maskSize: presetConfig.backgroundSize,
            WebkitMaskSize: presetConfig.backgroundSize,
            maskRepeat: 'repeat',
            WebkitMaskRepeat: 'repeat',
            ['--doc-bg-op-light' as any]: opacity ?? presetConfig.opacityLight,
            ['--doc-bg-op-dark' as any]: opacity ?? presetConfig.opacityDark,
          }}
          aria-hidden="true"
        />
      )}
    </>
  )
}
