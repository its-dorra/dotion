import {
  searchUnsplashPhotosServerFn,
  trackUnsplashDownloadServerFn,
} from './server'
import type { UnsplashPhoto } from './types'

export class UnsplashApi {
  async searchPhotos(
    query: string,
    page = 1,
    perPage = 24,
  ): Promise<UnsplashPhoto[]> {
    return await searchUnsplashPhotosServerFn({
      data: {
        query,
        page,
        perPage,
      },
    })
  }

  async trackDownload(downloadLocation?: string): Promise<void> {
    if (!downloadLocation) return
    await trackUnsplashDownloadServerFn({
      data: {
        downloadLocation,
      },
    })
  }
}

export const unsplashApi = new UnsplashApi()
