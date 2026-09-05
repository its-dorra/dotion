import { createServerFn } from '@tanstack/react-start'
import { createApi, type AssetBasic } from 'unsplash-js'
import { FALLBACK_UNSPLASH_PRESETS } from './constants'
import type { UnsplashPhoto } from './types'

function getUnsplashClient() {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY

  return createApi({
    accessKey,
    fetch: globalThis.fetch,
  })
}

function mapAssetToPhoto(asset: AssetBasic): UnsplashPhoto {
  const rawUrl = asset.urls.raw
  const thumbUrl = asset.urls.small || asset.urls.thumb || rawUrl

  return {
    id: asset.id,
    url: `${rawUrl}&auto=format&fit=crop&w=1600&q=80`,
    thumbUrl,
    photographer:
      asset.user.name || asset.user.username || 'Unsplash photographer',
    photographerUrl: `${asset.user.links.html}?utm_source=dotion&utm_medium=referral`,
    description: asset.description || 'Unsplash photography',
    blurHash: asset.blur_hash,
    color: asset.color,
    downloadLocation: asset.links?.download_location,
  }
}

export const searchUnsplashPhotosServerFn = createServerFn({ method: 'GET' })
  .validator(
    (data: { query?: string; page?: number; perPage?: number }) => data,
  )
  .handler(async ({ data }) => {
    const unsplash = getUnsplashClient()
    const trimmed = data.query?.trim() || ''
    const page = data.page ?? 1
    const perPage = data.perPage ?? 24

    try {
      if (trimmed) {
        const { data: searchData, error } = await unsplash.GET(
          '/search/photos',
          {
            params: {
              query: {
                query: trimmed,
                page,
                per_page: perPage,
              },
            },
          },
        )

        if (error || !searchData?.results) {
          console.warn('Unsplash SDK search error:', error)
          return filterFallback(trimmed)
        }

        return searchData.results.map((asset) => mapAssetToPhoto(asset))
      } else {
        const { data: photosData, error } = await unsplash.GET('/photos', {
          params: {
            query: {
              page,
              per_page: perPage,
              order_by: 'popular',
            },
          },
        })

        if (error || !photosData) {
          console.warn('Unsplash SDK list error:', error)
          return filterFallback(trimmed)
        }

        return photosData.map((asset) => mapAssetToPhoto(asset))
      }
    } catch (error) {
      console.error('Server error executing Unsplash SDK:', error)
      return filterFallback(trimmed)
    }
  })

export const trackUnsplashDownloadServerFn = createServerFn({ method: 'POST' })
  .validator((data: { downloadLocation: string }) => data)
  .handler(async ({ data }) => {
    if (!data.downloadLocation) return
    const accessKey = process.env.UNSPLASH_ACCESS_KEY

    try {
      await fetch(data.downloadLocation, {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
      })
    } catch (error) {
      console.error('Error tracking Unsplash download on server:', error)
    }
  })

function filterFallback(query: string): UnsplashPhoto[] {
  if (!query) return FALLBACK_UNSPLASH_PRESETS
  const lower = query.toLowerCase()
  const matches = FALLBACK_UNSPLASH_PRESETS.filter((p) =>
    p.description?.toLowerCase().includes(lower),
  )
  return matches.length > 0 ? matches : FALLBACK_UNSPLASH_PRESETS
}
