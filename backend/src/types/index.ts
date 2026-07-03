export interface VideoSummary {
  id: string
  title: string
  channelTitle: string
  channelId: string
  duration: string        // "MM:SS" или "HH:MM:SS"
  thumbnail: string
  views: number
  publishedAt: string     // ISO 8601
}

// Метаданные видео БЕЗ ссылки на воспроизведение.
// streamUrl отдаётся отдельным эндпоинтом /api/stream/:id.
export interface VideoDetails extends VideoSummary {
  description: string
}

export interface Channel {
  id: string
  title: string
  description: string
  thumbnail: string
  subscribers: number
  videos: VideoSummary[]
}

export interface StreamInfo {
  id: string
  streamUrl: string | null
  mimeType: string | null
  note: string
}

// Ответ пагинированного поиска.
export interface SearchResult {
  query: string
  page: number
  limit: number
  total: number
  hasMore: boolean
  results: VideoSummary[]
}
