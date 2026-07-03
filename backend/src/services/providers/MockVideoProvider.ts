import {
  Channel,
  SearchResult,
  StreamInfo,
  VideoDetails,
  VideoSummary,
} from "../../types"
import { VideoProvider } from "./VideoProvider"

// Внутренняя mock-модель: метаданные + ссылка на воспроизведение.
interface MockVideo extends VideoDetails {
  streamUrl: string | null
  mimeType: string
}

const BUCKET =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample"
const IMG =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/images"

// Публичные тестовые mp4 (H.264/AAC) — совместимы с iOS 12 через expo-av.
const MOCK_VIDEOS: MockVideo[] = [
  {
    id: "vid1",
    title: "Big Buck Bunny — тестовое видео",
    channelTitle: "Demo Channel",
    channelId: "chan1",
    duration: "9:56",
    thumbnail: `${IMG}/BigBuckBunny.jpg`,
    views: 1200345,
    publishedAt: "2023-05-01T10:00:00.000Z",
    description:
      "Демонстрационный ролик Big Buck Bunny. Формат H.264/AAC mp4 — совместим с iOS 12.",
    streamUrl: `${BUCKET}/BigBuckBunny.mp4`,
    mimeType: "video/mp4",
  },
  {
    id: "vid2",
    title: "Elephants Dream — открытый фильм",
    channelTitle: "Demo Channel",
    channelId: "chan1",
    duration: "10:53",
    thumbnail: `${IMG}/ElephantsDream.jpg`,
    views: 845012,
    publishedAt: "2022-11-12T09:00:00.000Z",
    description: "Elephants Dream — свободный анимационный фильм. mp4 H.264/AAC.",
    streamUrl: `${BUCKET}/ElephantsDream.mp4`,
    mimeType: "video/mp4",
  },
  {
    id: "vid3",
    title: "For Bigger Blazes — короткий клип",
    channelTitle: "Test Studio",
    channelId: "chan2",
    duration: "0:15",
    thumbnail: `${IMG}/ForBiggerBlazes.jpg`,
    views: 33210,
    publishedAt: "2024-02-20T14:30:00.000Z",
    description: "Короткий тестовый клип. mp4 H.264/AAC.",
    streamUrl: `${BUCKET}/ForBiggerBlazes.mp4`,
    mimeType: "video/mp4",
  },
  {
    id: "vid4",
    title: "For Bigger Escapes — демо",
    channelTitle: "Test Studio",
    channelId: "chan2",
    duration: "0:15",
    thumbnail: `${IMG}/ForBiggerEscapes.jpg`,
    views: 51200,
    publishedAt: "2024-03-02T12:00:00.000Z",
    description: "Тестовый клип For Bigger Escapes. mp4 H.264/AAC.",
    streamUrl: `${BUCKET}/ForBiggerEscapes.mp4`,
    mimeType: "video/mp4",
  },
  {
    id: "vid5",
    title: "For Bigger Fun — демо",
    channelTitle: "Test Studio",
    channelId: "chan2",
    duration: "0:15",
    thumbnail: `${IMG}/ForBiggerFun.jpg`,
    views: 12800,
    publishedAt: "2024-04-10T08:30:00.000Z",
    description: "Тестовый клип For Bigger Fun. mp4 H.264/AAC.",
    streamUrl: `${BUCKET}/ForBiggerFun.mp4`,
    mimeType: "video/mp4",
  },
  {
    id: "vid6",
    title: "For Bigger Joyrides — демо",
    channelTitle: "Demo Channel",
    channelId: "chan1",
    duration: "0:15",
    thumbnail: `${IMG}/ForBiggerJoyrides.jpg`,
    views: 98700,
    publishedAt: "2024-05-01T18:00:00.000Z",
    description: "Тестовый клип For Bigger Joyrides. mp4 H.264/AAC.",
    streamUrl: `${BUCKET}/ForBiggerJoyrides.mp4`,
    mimeType: "video/mp4",
  },
  {
    id: "vid7",
    title: "For Bigger Meltdowns — демо",
    channelTitle: "Demo Channel",
    channelId: "chan1",
    duration: "0:15",
    thumbnail: `${IMG}/ForBiggerMeltdowns.jpg`,
    views: 44300,
    publishedAt: "2024-05-20T15:45:00.000Z",
    description: "Тестовый клип For Bigger Meltdowns. mp4 H.264/AAC.",
    streamUrl: `${BUCKET}/ForBiggerMeltdowns.mp4`,
    mimeType: "video/mp4",
  },
  {
    id: "vid8",
    title: "Sintel — открытый фильм",
    channelTitle: "Test Studio",
    channelId: "chan2",
    duration: "0:52",
    thumbnail: `${IMG}/Sintel.jpg`,
    views: 271005,
    publishedAt: "2023-09-14T11:20:00.000Z",
    description: "Sintel — свободный короткометражный фильм. mp4 H.264/AAC.",
    streamUrl: `${BUCKET}/Sintel.mp4`,
    mimeType: "video/mp4",
  },
]

const MOCK_CHANNELS: Record<string, Omit<Channel, "videos">> = {
  chan1: {
    id: "chan1",
    title: "Demo Channel",
    description: "Канал с демонстрационными открытыми роликами.",
    thumbnail: `${IMG}/BigBuckBunny.jpg`,
    subscribers: 154000,
  },
  chan2: {
    id: "chan2",
    title: "Test Studio",
    description: "Короткие тестовые видео.",
    thumbnail: `${IMG}/ForBiggerBlazes.jpg`,
    subscribers: 4200,
  },
}

function toSummary(v: MockVideo): VideoSummary {
  const { description, streamUrl, mimeType, ...summary } = v
  return summary
}

export class MockVideoProvider implements VideoProvider {
  async searchVideos(
    query: string,
    page: number,
    limit: number
  ): Promise<SearchResult> {
    const q = query.trim().toLowerCase()
    const all = MOCK_VIDEOS.map(toSummary).filter(
      (v) =>
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.channelTitle.toLowerCase().includes(q)
    )
    const total = all.length
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit < 1 ? 1 : limit
    const start = (safePage - 1) * safeLimit
    const results = all.slice(start, start + safeLimit)
    const hasMore = start + safeLimit < total
    return { query, page: safePage, limit: safeLimit, total, hasMore, results }
  }

  async getVideo(id: string): Promise<VideoDetails | null> {
    const v = MOCK_VIDEOS.find((x) => x.id === id)
    if (!v) return null
    const { streamUrl, mimeType, ...details } = v
    return details
  }

  async getChannel(id: string): Promise<Channel | null> {
    const base = MOCK_CHANNELS[id]
    if (!base) return null
    const videos = MOCK_VIDEOS.filter((v) => v.channelId === id).map(toSummary)
    return { ...base, videos }
  }

  async getStream(id: string): Promise<StreamInfo | null> {
    const video = MOCK_VIDEOS.find((v) => v.id === id)
    if (!video) return null
    return {
      id,
      streamUrl: video.streamUrl,
      mimeType: video.streamUrl ? video.mimeType : null,
      note: "MOCK: публичный тестовый mp4 (H.264/AAC), совместим с iOS 12.",
    }
  }

  // Рекомендации: в mock-режиме — все видео, отсортированные по просмотрам.
  async getTrending(
    _region: string,
    page: number,
    limit: number
  ): Promise<VideoSummary[]> {
    const all = MOCK_VIDEOS.map(toSummary).sort((a, b) => b.views - a.views)
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit < 1 ? 1 : limit
    const start = (safePage - 1) * safeLimit
    return all.slice(start, start + safeLimit)
  }

  // Похожие: сначала видео того же канала, потом остальные.
  async getRelated(id: string, limit: number): Promise<VideoSummary[]> {
    const current = MOCK_VIDEOS.find((v) => v.id === id)
    const others = MOCK_VIDEOS.filter((v) => v.id !== id).map(toSummary)
    if (!current) return others.slice(0, limit)
    const sameChannel = others.filter((v) => v.channelId === current.channelId)
    const rest = others.filter((v) => v.channelId !== current.channelId)
    return [...sameChannel, ...rest].slice(0, limit)
  }
}
