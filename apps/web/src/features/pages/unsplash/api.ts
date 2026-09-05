import {
  searchUnsplashPhotosServerFn,
  trackUnsplashDownloadServerFn,
} from './server'
import type { UnsplashPhoto } from './types'

export class UnsplashApi {
  /**
   * Calls the TanStack Start server function which uses unsplash-js SDK with the server-side access key
   */
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

  /**
   * Tracks photo download via TanStack Start server function
   */
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
