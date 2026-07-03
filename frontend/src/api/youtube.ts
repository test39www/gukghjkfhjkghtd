import { Channel, SearchResponse, StreamInfo, VideoDetails } from "../types"
import { apiFetch } from "./client"

export function searchVideos(
  q: string,
  page = 1,
  limit = 5
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

export const checkHealth = (baseOverride?: string) =>
  apiFetch<{ status: string; dataSource: string }>(
    `/api/health`,
    undefined,
    baseOverride
  )
