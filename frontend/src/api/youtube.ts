import {
  Channel,
  SearchResponse,
  StreamInfo,
  VideoDetails,
  VideoSummary,
} from "../types"
import { apiFetch } from "./client"

export function searchVideos(
  q: string,
  page = 1,
  limit = 10
): Promise<SearchResponse> {
  return apiFetch<SearchResponse>(
    `/api/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`
  )
}

// Метаданные видео.
export const getVideo = (id: string) =>
  apiFetch<VideoDetails>(`/api/video/${encodeURIComponent(id)}`)

// Ссылка на воспроизведение — отдельным запросом.
export const getStream = (id: string) =>
  apiFetch<StreamInfo>(`/api/stream/${encodeURIComponent(id)}`)

export const getChannel = (id: string) =>
  apiFetch<Channel>(`/api/channel/${encodeURIComponent(id)}`)

// Рекомендации / тренды (главный экран).
export const getTrending = (region?: string, page = 1, limit = 15) =>
  apiFetch<{ region: string; page: number; limit: number; results: VideoSummary[] }>(
    `/api/trending?page=${page}&limit=${limit}${
      region ? `&region=${encodeURIComponent(region)}` : ""
    }`
  )

// Похожие видео.
export const getRelated = (id: string, limit = 12) =>
  apiFetch<{ id: string; results: VideoSummary[] }>(
    `/api/related/${encodeURIComponent(id)}?limit=${limit}`
  )

export const checkHealth = (baseOverride?: string) =>
  apiFetch<{ status: string; dataSource: string; region?: string }>(
    `/api/health`,
    undefined,
    baseOverride
  )
