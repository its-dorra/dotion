import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from '@tanstack/react-query'
import { unsplashApi } from './api'

export const unsplashKeys = {
  all: ['unsplash'] as const,
  search: (query: string) => [...unsplashKeys.all, 'search', query] as const,
  infinite: (query: string) =>
    [...unsplashKeys.all, 'infinite', query] as const,
}

export function unsplashSearchQueryOptions(query: string) {
  const normalizedQuery = query.trim() || 'minimalist wallpaper'

  return queryOptions({
    queryKey: unsplashKeys.search(normalizedQuery),
    queryFn: () => unsplashApi.searchPhotos(normalizedQuery),
    placeholderData: keepPreviousData,
  })
}

export function unsplashInfiniteQueryOptions(query: string) {
  const normalizedQuery = query.trim() || 'minimalist wallpaper'

  return infiniteQueryOptions({
    queryKey: unsplashKeys.infinite(normalizedQuery),
    queryFn: ({ pageParam = 1 }) =>
      unsplashApi.searchPhotos(normalizedQuery, pageParam, 24),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < 24) return undefined
      return allPages.length + 1
    },
  })
}
