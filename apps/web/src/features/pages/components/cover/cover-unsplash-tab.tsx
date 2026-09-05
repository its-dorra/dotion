import { useState, useEffect, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, Loader2, ImageIcon, ExternalLink, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import * as m from '@/paraglide/messages'
import { unsplashInfiniteQueryOptions } from '../../unsplash/query-options'
import { unsplashApi } from '../../unsplash/api'
import type { UnsplashPhoto } from '../../unsplash/types'

interface CoverUnsplashTabProps {
  cover?: string | null
  onSelect: (url: string) => void
}

const POPULAR_KEYWORDS = [
  'Minimalism',
  'Gradients',
  'Nature',
  'Space',
  'Abstract',
  'Architecture',
  'Textures',
  'Japan',
  'Dark',
  'Mountains',
]

export function CoverUnsplashTab({ cover, onSelect }: CoverUnsplashTabProps) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const observerRef = useRef<HTMLDivElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim())
    }, 350)
    return () => clearTimeout(timer)
  }, [inputValue])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery(unsplashInfiniteQueryOptions(debouncedQuery))

  const photos = data?.pages.flatMap((page) => page) ?? []

  useEffect(() => {
    const el = observerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  function handlePhotoSelect(photo: UnsplashPhoto) {
    if (photo.downloadLocation) {
      void unsplashApi.trackDownload(photo.downloadLocation)
    }
    onSelect(photo.url)
  }

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b space-y-3 bg-muted/10">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search and choose an image from Unsplash..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-9 text-sm bg-background"
            autoFocus
          />
        </div>

        {/* Popular keyword pills */}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_KEYWORDS.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => setInputValue(keyword)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                inputValue.toLowerCase() === keyword.toLowerCase()
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted text-muted-foreground'
              }`}
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="h-80 px-4 sm:px-6 py-4">
        {isPending ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : photos.length === 0 ? (
          <Empty className="h-48 border-0 p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ImageIcon className="size-5 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-medium">
                {m.unsplash_no_images_title({ query: inputValue })}
              </EmptyTitle>
              <EmptyDescription className="text-xs">
                {m.unsplash_no_images_desc()}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => {
                const isSelected = cover === photo.url
                return (
                  <div
                    key={photo.id}
                    className="group relative h-24 rounded-lg overflow-hidden border transition-all hover:ring-2 hover:ring-primary/80"
                  >
                    <button
                      type="button"
                      onClick={() => handlePhotoSelect(photo)}
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
                          {photo.description ??
                            `Photo by ${photo.photographer}`}
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

                    {isSelected ? (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                        <Check className="h-3 w-3" />
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {/* Bottom Sentinel & Loading indicator for Infinite Scrolling */}
            <div
              ref={observerRef}
              className="py-2 flex justify-center items-center min-h-[32px]"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading more photos...</span>
                </div>
              ) : hasNextPage ? (
                <span className="text-xs text-muted-foreground/50">
                  Scroll down for more
                </span>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-4 text-center pb-2">
          <p className="text-[11px] text-muted-foreground">
            Photos provided by{' '}
            <a
              href="https://unsplash.com?utm_source=dotion&utm_medium=referral"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground font-medium"
            >
              Unsplash
            </a>
          </p>
        </div>
      </ScrollArea>
    </div>
  )
}
