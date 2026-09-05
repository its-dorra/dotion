import * as m from '@/paraglide/messages'
import {
  Sparkles,
  Heart,
  Grid,
  CircleDot,
  Slash,
  Plus,
  Cloud,
  PartyPopper,
  Music,
  Leaf,
  Flower2,
  Waves,
  CloudRain,
  Sun,
  Compass,
  Moon,
  Orbit,
  Box,
  LayoutGrid,
  Hexagon,
  ChevronsUp,
  Shapes,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export type BackgroundCategory =
  | 'all'
  | 'minimal'
  | 'playful'
  | 'nature'
  | 'cosmic'
  | 'geometric'

export type DocumentBackgroundPreset =
  | 'none'
  | 'dots'
  | 'grid'
  | 'diagonal-lines'
  | 'crosses'
  | 'hearts'
  | 'sparkles'
  | 'clouds'
  | 'confetti'
  | 'music'
  | 'botanical'
  | 'cherry-blossom'
  | 'zen-waves'
  | 'rain'
  | 'sunburst'
  | 'constellations'
  | 'crescent-moons'
  | 'galaxy-dust'
  | 'isometric-cubes'
  | 'moroccan-tiles'
  | 'honeycomb'
  | 'chevron'
  | 'bauhaus-shapes'

export interface BackgroundPresetConfig {
  id: DocumentBackgroundPreset
  category: Exclude<BackgroundCategory, 'all'>
  getName: () => string
  icon: LucideIcon
  backgroundSize: string
  opacityLight: number
  opacityDark: number
  svgDataUri: string | null
}

function createSvgDataUri(
  svgContent: string,
  width: number,
  height: number,
): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgContent}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(fullSvg)}`
}

export const DOCUMENT_BACKGROUND_PRESETS: BackgroundPresetConfig[] = [
  // --- MINIMAL ---
  {
    id: 'none',
    category: 'minimal',
    getName: () => m.bg_preset_none(),
    icon: FileText,
    backgroundSize: 'auto',
    opacityLight: 0,
    opacityDark: 0,
    svgDataUri: null,
  },
  {
    id: 'dots',
    category: 'minimal',
    getName: () => m.bg_preset_dots(),
    icon: CircleDot,
    backgroundSize: '20px 20px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<circle cx="10" cy="10" r="1.5" fill="black"/>',
      20,
      20,
    ),
  },
  {
    id: 'grid',
    category: 'minimal',
    getName: () => m.bg_preset_grid(),
    icon: Grid,
    backgroundSize: '24px 24px',
    opacityLight: 0.13,
    opacityDark: 0.09,
    svgDataUri: createSvgDataUri(
      '<path d="M 24 0 L 0 0 0 24" fill="none" stroke="black" stroke-width="1"/>',
      24,
      24,
    ),
  },
  {
    id: 'diagonal-lines',
    category: 'minimal',
    getName: () => m.bg_preset_diagonal_lines(),
    icon: Slash,
    backgroundSize: '20px 20px',
    opacityLight: 0.13,
    opacityDark: 0.09,
    svgDataUri: createSvgDataUri(
      '<path d="M-5,5 l10,-10 M0,20 l20,-20 M15,25 l10,-10" stroke="black" stroke-width="1"/>',
      20,
      20,
    ),
  },
  {
    id: 'crosses',
    category: 'minimal',
    getName: () => m.bg_preset_crosses(),
    icon: Plus,
    backgroundSize: '28px 28px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<path d="M10 14h8M14 10v8" stroke="black" stroke-width="1.5" stroke-linecap="round"/>',
      28,
      28,
    ),
  },

  // --- PLAYFUL & CUTE ---
  {
    id: 'hearts',
    category: 'playful',
    getName: () => m.bg_preset_hearts(),
    icon: Heart,
    backgroundSize: '48px 48px',
    opacityLight: 0.15,
    opacityDark: 0.11,
    svgDataUri: createSvgDataUri(
      '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" transform="translate(4,4) scale(0.65)" fill="black"/><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" transform="translate(28,24) scale(0.45) rotate(15)" stroke="black" stroke-width="2" fill="none"/>',
      48,
      48,
    ),
  },
  {
    id: 'sparkles',
    category: 'playful',
    getName: () => m.bg_preset_sparkles(),
    icon: Sparkles,
    backgroundSize: '44px 44px',
    opacityLight: 0.15,
    opacityDark: 0.11,
    svgDataUri: createSvgDataUri(
      '<path d="M12 4 Q12 12 4 12 Q12 12 12 20 Q12 12 20 12 Q12 12 12 4 Z" fill="black"/><path d="M32 26 L36 32 L32 38 L28 32 Z" fill="black"/><circle cx="34" cy="10" r="1.5" fill="black"/>',
      44,
      44,
    ),
  },
  {
    id: 'clouds',
    category: 'playful',
    getName: () => m.bg_preset_clouds(),
    icon: Cloud,
    backgroundSize: '56px 56px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<path d="M10 20 a 5 5 0 0 1 8 -3 a 7 7 0 0 1 12 1 a 5 5 0 0 1 4 5 a 3 3 0 0 1 -3 3 l -19 0 a 4 4 0 0 1 -2 -6 z" fill="none" stroke="black" stroke-width="1.5"/><path d="M6 14 a 3.5 3.5 0 0 1 5.5 -2 a 5 5 0 0 1 8 0.5 a 3.5 3.5 0 0 1 3 3.5 a 2 2 0 0 1 -2 2 l -13 0 a 3 3 0 0 1 -1.5 -4 z" transform="translate(26, 26) scale(0.85)" fill="none" stroke="black" stroke-width="1.5"/>',
      56,
      56,
    ),
  },
  {
    id: 'confetti',
    category: 'playful',
    getName: () => m.bg_preset_confetti(),
    icon: PartyPopper,
    backgroundSize: '42px 42px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<circle cx="8" cy="8" r="1.8" fill="black"/><rect x="22" y="6" width="5" height="2.5" transform="rotate(25 24 7)" fill="black"/><path d="M10 28 L15 25 L13 32 Z" fill="black"/><path d="M28 20 C30 18 32 22 34 20" fill="none" stroke="black" stroke-width="1.5"/><circle cx="28" cy="34" r="1.5" fill="black"/>',
      42,
      42,
    ),
  },
  {
    id: 'music',
    category: 'playful',
    getName: () => m.bg_preset_music(),
    icon: Music,
    backgroundSize: '48px 48px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<path d="M9 16V4l8-2v12" transform="translate(6,6) scale(0.75)" fill="none" stroke="black" stroke-width="1.5"/><circle cx="10.5" cy="18" r="2.8" fill="black"/><circle cx="19" cy="16" r="2.8" fill="black"/><path d="M6 12V2" transform="translate(30,24) scale(0.75)" fill="none" stroke="black" stroke-width="1.5"/><circle cx="33" cy="33" r="2.5" fill="black"/>',
      48,
      48,
    ),
  },

  // --- NATURE & ZEN ---
  {
    id: 'botanical',
    category: 'nature',
    getName: () => m.bg_preset_botanical(),
    icon: Leaf,
    backgroundSize: '60px 60px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<path d="M10 50 Q20 30 35 15 M18 38 Q25 32 30 35 M24 28 Q15 22 20 18 M28 22 Q35 18 38 22 M33 17 Q35 10 38 12" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round"/><path d="M42 48 Q48 42 46 36 Q42 42 42 48 M42 48 Q38 42 40 36 Q42 42 42 48" fill="none" stroke="black" stroke-width="1.2"/>',
      60,
      60,
    ),
  },
  {
    id: 'cherry-blossom',
    category: 'nature',
    getName: () => m.bg_preset_cherry_blossom(),
    icon: Flower2,
    backgroundSize: '48px 48px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<path d="M18 10 C16 4, 22 4, 20 10 C26 6, 30 12, 23 13 C28 18, 24 22, 19 17 C16 23, 11 20, 14 15 C8 14, 9 8, 16 11" fill="none" stroke="black" stroke-width="1.4"/><path d="M34 32 C38 28, 42 32, 38 38 C34 38, 32 34, 34 32 Z" fill="black"/>',
      48,
      48,
    ),
  },
  {
    id: 'zen-waves',
    category: 'nature',
    getName: () => m.bg_preset_zen_waves(),
    icon: Waves,
    backgroundSize: '64px 64px',
    opacityLight: 0.13,
    opacityDark: 0.09,
    svgDataUri: createSvgDataUri(
      '<path d="M0 16 Q16 6 32 16 T64 16 M0 36 Q16 46 32 36 T64 36 M0 56 Q16 46 32 56 T64 56" fill="none" stroke="black" stroke-width="1.2"/>',
      64,
      64,
    ),
  },
  {
    id: 'rain',
    category: 'nature',
    getName: () => m.bg_preset_rain(),
    icon: CloudRain,
    backgroundSize: '36px 36px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<line x1="8" y1="4" x2="4" y2="14" stroke="black" stroke-width="1.4" stroke-linecap="round"/><line x1="26" y1="12" x2="22" y2="22" stroke="black" stroke-width="1.4" stroke-linecap="round"/><line x1="14" y1="24" x2="10" y2="34" stroke="black" stroke-width="1.4" stroke-linecap="round"/>',
      36,
      36,
    ),
  },
  {
    id: 'sunburst',
    category: 'nature',
    getName: () => m.bg_preset_sunburst(),
    icon: Sun,
    backgroundSize: '50px 50px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<circle cx="25" cy="25" r="4.5" fill="none" stroke="black" stroke-width="1.4"/><path d="M25 14v4M25 32v4M14 25h4M32 25h4M17 17l3 3M30 30l3 3M17 33l3-3M30 17l3 3" stroke="black" stroke-width="1.2" stroke-linecap="round"/>',
      50,
      50,
    ),
  },

  // --- COSMIC ---
  {
    id: 'constellations',
    category: 'cosmic',
    getName: () => m.bg_preset_constellations(),
    icon: Compass,
    backgroundSize: '68px 68px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<circle cx="15" cy="15" r="2" fill="black"/><circle cx="35" cy="22" r="1.6" fill="black"/><circle cx="48" cy="12" r="1.8" fill="black"/><circle cx="58" cy="35" r="1.6" fill="black"/><circle cx="22" cy="52" r="2" fill="black"/><circle cx="45" cy="58" r="1.7" fill="black"/><path d="M15 15 L35 22 L48 12 M35 22 L58 35 M22 52 L45 58" fill="none" stroke="black" stroke-width="0.9" stroke-dasharray="2 2"/>',
      68,
      68,
    ),
  },
  {
    id: 'crescent-moons',
    category: 'cosmic',
    getName: () => m.bg_preset_crescent_moons(),
    icon: Moon,
    backgroundSize: '52px 52px',
    opacityLight: 0.14,
    opacityDark: 0.1,
    svgDataUri: createSvgDataUri(
      '<path d="M18 8 A10 10 0 0 0 18 28 A8 8 0 0 1 18 8 Z" fill="black"/><path d="M34 14 L36 17 L39 17 L37 19 L38 22 L34 20 L30 22 L31 19 L29 17 L32 17 Z" transform="scale(0.65) translate(22,8)" fill="black"/><circle cx="36" cy="38" r="1.4" fill="black"/>',
      52,
      52,
    ),
  },
  {
    id: 'galaxy-dust',
    category: 'cosmic',
    getName: () => m.bg_preset_galaxy_dust(),
    icon: Orbit,
    backgroundSize: '40px 40px',
    opacityLight: 0.15,
    opacityDark: 0.11,
    svgDataUri: createSvgDataUri(
      '<circle cx="6" cy="10" r="1.1" fill="black"/><circle cx="18" cy="6" r="1.5" fill="black"/><circle cx="32" cy="14" r="0.9" fill="black"/><circle cx="12" cy="28" r="1.2" fill="black"/><circle cx="28" cy="26" r="1.6" fill="black"/><circle cx="36" cy="34" r="1" fill="black"/><circle cx="20" cy="38" r="1.1" fill="black"/>',
      40,
      40,
    ),
  },

  // --- GEOMETRIC ---
  {
    id: 'isometric-cubes',
    category: 'geometric',
    getName: () => m.bg_preset_isometric_cubes(),
    icon: Box,
    backgroundSize: '36px 62.35px',
    opacityLight: 0.13,
    opacityDark: 0.09,
    svgDataUri: createSvgDataUri(
      '<path d="M18 0 L36 10.39 L36 31.18 L18 41.57 L0 31.18 L0 10.39 Z M18 0 L18 20.78 L0 31.18 M18 20.78 L36 31.18 M18 41.57 L18 62.35 L0 51.96 M18 62.35 L36 51.96" fill="none" stroke="black" stroke-width="1"/>',
      36,
      62.35,
    ),
  },
  {
    id: 'moroccan-tiles',
    category: 'geometric',
    getName: () => m.bg_preset_moroccan_tiles(),
    icon: LayoutGrid,
    backgroundSize: '44px 44px',
    opacityLight: 0.13,
    opacityDark: 0.09,
    svgDataUri: createSvgDataUri(
      '<path d="M0 22 C11 22 11 0 22 0 C33 0 33 22 44 22 C33 22 33 44 22 44 C11 44 11 22 0 22 Z M22 22 C11 22 11 44 0 44 M22 22 C33 22 33 44 44 44 M22 22 C33 22 33 0 44 0 M22 22 C11 22 11 0 0 0" fill="none" stroke="black" stroke-width="1.1"/>',
      44,
      44,
    ),
  },
  {
    id: 'honeycomb',
    category: 'geometric',
    getName: () => m.bg_preset_honeycomb(),
    icon: Hexagon,
    backgroundSize: '28px 48.5px',
    opacityLight: 0.13,
    opacityDark: 0.09,
    svgDataUri: createSvgDataUri(
      '<path d="M14 0 L28 8.08 L28 24.25 L14 32.33 L0 24.25 L0 8.08 Z M14 32.33 L28 40.41 L28 56.59 M0 40.41 L0 56.59" fill="none" stroke="black" stroke-width="1"/>',
      28,
      48.5,
    ),
  },
  {
    id: 'chevron',
    category: 'geometric',
    getName: () => m.bg_preset_chevron(),
    icon: ChevronsUp,
    backgroundSize: '30px 30px',
    opacityLight: 0.13,
    opacityDark: 0.09,
    svgDataUri: createSvgDataUri(
      '<path d="M0 15 L15 0 L30 15 M0 30 L15 15 L30 30 M0 45 L15 30 L30 45" fill="none" stroke="black" stroke-width="1.1"/>',
      30,
      30,
    ),
  },
  {
    id: 'bauhaus-shapes',
    category: 'geometric',
    getName: () => m.bg_preset_bauhaus_shapes(),
    icon: Shapes,
    backgroundSize: '60px 60px',
    opacityLight: 0.13,
    opacityDark: 0.09,
    svgDataUri: createSvgDataUri(
      '<circle cx="16" cy="16" r="8" fill="none" stroke="black" stroke-width="1.4"/><path d="M38 8 L52 8 L45 22 Z" fill="black"/><path d="M8 44 C8 36 24 36 24 44" fill="none" stroke="black" stroke-width="1.5"/><rect x="36" y="34" width="16" height="16" rx="3" fill="none" stroke="black" stroke-width="1.4"/><line x1="8" y1="54" x2="24" y2="54" stroke="black" stroke-width="1.4" stroke-dasharray="2 2"/>',
      60,
      60,
    ),
  },
]

export const PRESET_MAP = new Map<
  DocumentBackgroundPreset,
  BackgroundPresetConfig
>(DOCUMENT_BACKGROUND_PRESETS.map((preset) => [preset.id, preset]))

export function getBackgroundPresetConfig(
  id: DocumentBackgroundPreset,
): BackgroundPresetConfig {
  return PRESET_MAP.get(id) ?? PRESET_MAP.get('none')!
}

export type DocumentBackgroundColor =
  | 'default'
  | 'rose'
  | 'violet'
  | 'sky'
  | 'emerald'
  | 'amber'
  | 'indigo'
  | 'teal'
  | 'fuchsia'

export interface BackgroundColorConfig {
  id: DocumentBackgroundColor
  getName: () => string
  patternClass: string
  swatchClass: string
  glowClass: string
}

export const DOCUMENT_BACKGROUND_COLORS: BackgroundColorConfig[] = [
  {
    id: 'default',
    getName: () => m.bg_color_default(),
    patternClass: 'bg-foreground',
    swatchClass: 'bg-foreground',
    glowClass: '',
  },
  {
    id: 'rose',
    getName: () => m.bg_color_rose(),
    patternClass: 'bg-rose-500 dark:bg-rose-400',
    swatchClass: 'bg-rose-500',
    glowClass: 'bg-rose-500/5 dark:bg-rose-500/5',
  },
  {
    id: 'violet',
    getName: () => m.bg_color_violet(),
    patternClass: 'bg-violet-500 dark:bg-violet-400',
    swatchClass: 'bg-violet-500',
    glowClass: 'bg-violet-500/5 dark:bg-violet-500/5',
  },
  {
    id: 'sky',
    getName: () => m.bg_color_sky(),
    patternClass: 'bg-sky-500 dark:bg-sky-400',
    swatchClass: 'bg-sky-500',
    glowClass: 'bg-sky-500/5 dark:bg-sky-500/5',
  },
  {
    id: 'emerald',
    getName: () => m.bg_color_emerald(),
    patternClass: 'bg-emerald-500 dark:bg-emerald-400',
    swatchClass: 'bg-emerald-500',
    glowClass: 'bg-emerald-500/5 dark:bg-emerald-500/5',
  },
  {
    id: 'amber',
    getName: () => m.bg_color_amber(),
    patternClass: 'bg-amber-500 dark:bg-amber-400',
    swatchClass: 'bg-amber-500',
    glowClass: 'bg-amber-500/5 dark:bg-amber-500/5',
  },
  {
    id: 'indigo',
    getName: () => m.bg_color_indigo(),
    patternClass: 'bg-indigo-500 dark:bg-indigo-400',
    swatchClass: 'bg-indigo-500',
    glowClass: 'bg-indigo-500/5 dark:bg-indigo-500/5',
  },
  {
    id: 'teal',
    getName: () => m.bg_color_teal(),
    patternClass: 'bg-teal-500 dark:bg-teal-400',
    swatchClass: 'bg-teal-500',
    glowClass: 'bg-teal-500/5 dark:bg-teal-500/5',
  },
  {
    id: 'fuchsia',
    getName: () => m.bg_color_fuchsia(),
    patternClass: 'bg-fuchsia-500 dark:bg-fuchsia-400',
    swatchClass: 'bg-fuchsia-500',
    glowClass: 'bg-fuchsia-500/5 dark:bg-fuchsia-500/5',
  },
]

export const COLOR_MAP = new Map<
  DocumentBackgroundColor,
  BackgroundColorConfig
>(DOCUMENT_BACKGROUND_COLORS.map((color) => [color.id, color]))

export function getBackgroundColorConfig(
  id: DocumentBackgroundColor,
): BackgroundColorConfig {
  return COLOR_MAP.get(id) ?? COLOR_MAP.get('default')!
}
