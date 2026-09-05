import { useState } from 'react'
import { Check } from 'lucide-react'
import { useDocumentBackground } from '@/components/common/document-background-provider'
import {
  DOCUMENT_BACKGROUND_PRESETS,
  DOCUMENT_BACKGROUND_COLORS,
  type BackgroundCategory,
  type DocumentBackgroundPreset,
  type DocumentBackgroundColor,
} from '../lib/document-background'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

export function DocumentBackgroundPicker() {
  const {
    background,
    backgroundColor,
    setBackground,
    setBackgroundColor,
    presetConfig,
    colorConfig,
  } = useDocumentBackground()

  const [selectedCategory, setSelectedCategory] =
    useState<BackgroundCategory>('all')

  const filteredPresets =
    selectedCategory === 'all'
      ? DOCUMENT_BACKGROUND_PRESETS
      : DOCUMENT_BACKGROUND_PRESETS.filter(
          (preset) => preset.category === selectedCategory,
        )

  const categories: { id: BackgroundCategory; label: string }[] = [
    { id: 'all', label: m.settings_document_background_category_all() },
    { id: 'minimal', label: m.settings_document_background_category_minimal() },
    { id: 'playful', label: m.settings_document_background_category_playful() },
    { id: 'nature', label: m.settings_document_background_category_nature() },
    { id: 'cosmic', label: m.settings_document_background_category_cosmic() },
    {
      id: 'geometric',
      label: m.settings_document_background_category_geometric(),
    },
  ]

  const PreviewIcon = presetConfig.icon

  return (
    <div className="space-y-6">
      {/* Live Preview Card */}
      <div className="overflow-hidden rounded-xl border bg-card p-4 shadow-xs">
        <div className="mb-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wider">
            {m.settings_document_background_preview()}
          </span>
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span className="text-[11px] text-muted-foreground font-normal">
              {colorConfig.getName()}
            </span>
            <div className="flex items-center gap-1.5">
              <PreviewIcon className="h-3.5 w-3.5 text-primary" />
              <span>{presetConfig.getName()}</span>
            </div>
          </div>
        </div>
        <div className="relative h-32 w-full overflow-hidden rounded-lg border bg-background p-4 sm:h-36">
          {/* Ambient subtle color glow */}
          {colorConfig.glowClass && (
            <div
              className={cn(
                'pointer-events-none absolute inset-0 z-0 select-none transition-colors duration-500',
                colorConfig.glowClass,
              )}
              aria-hidden="true"
            />
          )}

          {/* SVG Pattern Mask */}
          {presetConfig.svgDataUri && (
            <div
              className={cn(
                'pointer-events-none absolute inset-0 z-0 select-none transition-all duration-300 opacity-[0.22] dark:opacity-[0.32]',
                colorConfig.patternClass,
              )}
              style={{
                maskImage: `url("${presetConfig.svgDataUri}")`,
                WebkitMaskImage: `url("${presetConfig.svgDataUri}")`,
                maskSize: presetConfig.backgroundSize,
                WebkitMaskSize: presetConfig.backgroundSize,
                maskRepeat: 'repeat',
                WebkitMaskRepeat: 'repeat',
              }}
              aria-hidden="true"
            />
          )}
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card/90 shadow-2xs backdrop-blur-xs">
                  <PreviewIcon className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div className="h-3.5 w-32 rounded-sm bg-foreground/80 font-medium" />
              </div>
              <div className="h-2 w-48 rounded-xs bg-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full max-w-xs rounded-xs bg-muted-foreground/20" />
              <div className="h-2 w-4/5 max-w-sm rounded-xs bg-muted-foreground/20" />
              <div className="h-2 w-2/3 max-w-xs rounded-xs bg-muted-foreground/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Color Palette Selector */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-muted-foreground">
          {m.settings_document_background_color_title()}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {DOCUMENT_BACKGROUND_COLORS.map((col) => {
            const isSelected = backgroundColor === col.id

            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setBackgroundColor(col.id as DocumentBackgroundColor)}
                className={cn(
                  'group relative flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary bg-accent text-foreground shadow-2xs ring-1 ring-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-accent/50 hover:text-foreground',
                )}
                aria-pressed={isSelected}
              >
                <span
                  className={cn(
                    'h-3.5 w-3.5 rounded-full ring-1 ring-black/10 shrink-0',
                    col.swatchClass,
                  )}
                />
                <span className="text-[12px]">{col.getName()}</span>
                {isSelected && (
                  <Check className="h-3 w-3 stroke-[2.5] text-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(val) => setSelectedCategory(val as BackgroundCategory)}
      >
        <TabsList className="h-9 w-full justify-start overflow-x-auto p-1 scrollbar-none">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="px-3 text-xs whitespace-nowrap"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Presets Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filteredPresets.map((preset) => {
          const isSelected = background === preset.id
          const Icon = preset.icon

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setBackground(preset.id as DocumentBackgroundPreset)}
              className={cn(
                'group relative flex flex-col items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-150 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                isSelected
                  ? 'border-primary bg-accent/40 shadow-xs ring-1 ring-primary'
                  : 'border-border bg-card hover:border-border/80',
              )}
              aria-pressed={isSelected}
            >
              {/* Thumbnail Swatch */}
              <div className="relative flex h-20 w-full items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-background transition-transform group-hover:scale-[1.02]">
                {/* Pattern Mask with selected color */}
                {preset.svgDataUri ? (
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-0 z-0 select-none transition-colors duration-200 opacity-[0.45] dark:opacity-[0.6]',
                      colorConfig.patternClass,
                    )}
                    style={{
                      maskImage: `url("${preset.svgDataUri}")`,
                      WebkitMaskImage: `url("${preset.svgDataUri}")`,
                      maskSize: preset.backgroundSize,
                      WebkitMaskSize: preset.backgroundSize,
                      maskRepeat: 'repeat',
                      WebkitMaskRepeat: 'repeat',
                    }}
                    aria-hidden="true"
                  />
                ) : null}

                {/* Floating Icon Center Badge */}
                <div
                  className={cn(
                    'relative z-10 flex h-7 w-7 items-center justify-center rounded-md border shadow-2xs transition-all backdrop-blur-xs',
                    isSelected
                      ? 'border-primary/50 bg-background text-primary'
                      : 'border-border/60 bg-background/90 text-foreground group-hover:scale-110',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="flex w-full min-w-0 items-center justify-between gap-1">
                <span
                  className={cn(
                    'truncate text-xs font-medium',
                    isSelected
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {preset.getName()}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
