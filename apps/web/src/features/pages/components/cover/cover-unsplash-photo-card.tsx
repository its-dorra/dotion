import { memo } from 'react'
import { Check, ExternalLink } from 'lucide-react'
import type { UnsplashPhoto } from '../../unsplash/types'

interface CoverUnsplashPhotoCardProps {
  photo: UnsplashPhoto
  isSelected: boolean
  onSelect: (photo: UnsplashPhoto) => void
}

export const CoverUnsplashPhotoCard = memo(function CoverUnsplashPhotoCard({
  photo,
  isSelected,
  onSelect,
}: CoverUnsplashPhotoCardProps) {
  return (
    <div className="group relative h-24 rounded-lg overflow-hidden border transition-all hover:ring-2 hover:ring-primary/80">
      <button
        type="button"
        onClick={() => onSelect(photo)}
        className="w-full h-full text-left focus-visible:outline-none cursor-pointer"
      >
        <img
          src={photo.thumbUrl}
          alt={photo.description ?? 'Unsplash cover'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
          <span className="text-[10px] font-medium text-white/90 truncate drop-shadow-sm">
            {photo.description ?? `Photo by ${photo.photographer}`}
          </span>
        </div>
      </button>

      <a
        href={photo.photographerUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-white/80 hover:text-white flex items-center gap-0.5 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs"
        title={`Photo by ${photo.photographer} on Unsplash`}
        onClick={(e) => e.stopPropagation()}
      >
        <span>{photo.photographer}</span>
        <ExternalLink className="h-2.5 w-2.5" />
      </a>

      {isSelected && (
        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
          <Check className="h-3 w-3" />
        </div>
      )}
    </div>
  )
})
