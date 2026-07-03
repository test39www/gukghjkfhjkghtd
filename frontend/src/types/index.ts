export interface VideoSummary {
  id: string
  title: string
  channelTitle: string
  channelId: string
  duration: string
  thumbnail: string
  views: number
  publishedAt: string
}

// Метаданные видео — без streamUrl (он приходит отдельно через StreamInfo).
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
export interface SearchResponse {
  query: string
  page: number
  limit: number
  total: number
  hasMore: boolean
  results: VideoSummary[]
}

// Подписка на канал (хранится локально под аккаунтом).
export interface Subscription {
  channelId: string
  channelTitle: string
  thumbnail: string
}

// Локальный аккаунт (без пароля в открытом виде).
export interface Account {
  username: string
  createdAt: string
}
