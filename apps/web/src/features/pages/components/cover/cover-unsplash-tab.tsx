import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { Search, Loader2, ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
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
import { CoverUnsplashPhotoCard } from './cover-unsplash-photo-card'

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
  const [debouncedQuery] = useDebouncedValue(inputValue.trim(), { wait: 350 })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery(unsplashInfiniteQueryOptions(debouncedQuery))

  const photos = data?.pages.flatMap((page) => page) ?? []

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
            placeholder={m.page_cover_unsplash_placeholder()}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-9 text-sm bg-background"
            autoFocus
          />
        </div>

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
              {photos.map((photo) => (
                <CoverUnsplashPhotoCard
                  key={photo.id}
                  photo={photo}
                  isSelected={cover === photo.url}
                  onSelect={handlePhotoSelect}
                />
              ))}
            </div>

            <InfiniteScroll
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
              loadingText={m.page_cover_unsplash_loading()}
              loadMoreText={m.page_cover_unsplash_scroll_more()}
            />
          </div>
        )}

        <div className="mt-4 text-center pb-2">
          <p className="text-[11px] text-muted-foreground">
            {m.page_cover_unsplash_attribution({
              unsplash: 'Unsplash',
            })}{' '}
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
