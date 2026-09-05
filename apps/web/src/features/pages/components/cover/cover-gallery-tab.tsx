import { Check } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CoverGalleryTabProps {
  cover?: string | null
  onSelect: (url: string) => void
}

const GALLERY_PRESET_GROUPS = [
  {
    id: 'gradients',
    title: 'Gradients & Minimalist Colors',
    items: [
      {
        id: 'g-1',
        name: 'Northern Lights',
        url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'g-2',
        name: 'Cosmic Twilight',
        url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'g-3',
        name: 'Warm Sunset',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'g-4',
        name: 'Velvet Rose',
        url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1600&q=80',
      },
    ],
  },
  {
    id: 'nature',
    title: 'Earth & Nature',
    items: [
      {
        id: 'n-1',
        name: 'Alpine Mountain Peaks',
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'n-2',
        name: 'Golden Desert Dunes',
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'n-3',
        name: 'Emerald Forest Canopy',
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 'n-4',
        name: 'Calm Crystal Lake',
        url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
      },
    ],
  },
  {
    id: 'space',
    title: 'NASA & Astronomy',
    items: [
      {
        id: 's-1',
        name: 'Deep Space Nebula',
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 's-2',
        name: 'Starry Milky Way',
        url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
      },
      {
        id: 's-3',
        name: 'Earth Horizon Orbit',
        url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1600&q=80',
      },
    ],
  },
]

export function CoverGalleryTab({ cover, onSelect }: CoverGalleryTabProps) {
  return (
    <ScrollArea className="h-96 px-4 sm:px-6 py-4">
      <div className="space-y-6">
        {GALLERY_PRESET_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2.5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.title}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {group.items.map((item) => {
                const isSelected = cover === item.url
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.url)}
                    className="group relative h-20 rounded-lg overflow-hidden border transition-all hover:ring-2 hover:ring-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-left cursor-pointer"
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[11px] font-medium text-white/90 truncate drop-shadow-sm">
                        {item.name}
                      </span>
                    </div>
                    {isSelected ? (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                        <Check className="h-3 w-3" />
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
