export interface UnsplashPhoto {
  id: string
  url: string
  thumbUrl: string
  photographer: string
  photographerUrl: string
  description?: string
  blurHash?: string | null
  color?: string | null
  downloadLocation?: string
}
