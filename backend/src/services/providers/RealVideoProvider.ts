import {
  Channel,
  SearchResult,
  StreamInfo,
  VideoDetails,
  VideoSummary,
} from "../../types"
import { badRequest, notFound } from "../../utils/errors"
import { VideoProvider } from "./VideoProvider"

/**
 * Реальный источник данных через Invidious (подход в духе youthub).
 *
 * Почему Invidious:
 * - Закрытый открытый API (`/api/v1/...`) — не требует официального
 *   YouTube Data API, ключей и авторизации Google.
 * - Поле `formatStreams` отдаёт уже смуксированные (video+audio) mp4
 *   в H.264/AAC (itag 18/22) — именно то, что проигрывает AVPlayer/expo-av
 *   на iOS 12 (без DASH/VP9/AV1).
 *
 * Инстансы задаются через INVIDIOUS_INSTANCES (через запятую).
 * Первый ответивший инстанс побеждает; при ошибке — fallback на следующий.
 */

const DEFAULT_INSTANCES = [
  "https://invidious.nerdvpn.de",
  "https://inv.nadeko.net",
  "https://invidious.jing.rocks",
  "https://yewtu.be",
]

const REGION = process.env.YT_REGION ?? "US"
const REQUEST_TIMEOUT_MS = Number(process.env.INVIDIOUS_TIMEOUT_MS ?? 12000)

interface InvThumb {
  url: string
  width: number
  height: number
  quality?: string
}

interface InvSearchItem {
  type: string
  videoId?: string
  title?: string
  author?: string
  authorId?: string
  lengthSeconds?: number
  viewCount?: number
  published?: number
  publishedText?: string
  videoThumbnails?: InvThumb[]
}

interface InvFormatStream {
  url: string
  itag: string
  type: string // например 'video/mp4; codecs="avc1.42001E, mp4a.40.2"'
  quality?: string
  resolution?: string
  container?: string
  encoding?: string
}

interface InvVideo {
  videoId: string
  title: string
  author: string
  authorId: string
  description?: string
  descriptionHtml?: string
  viewCount?: number
  lengthSeconds?: number
  published?: number
  publishedText?: string
  videoThumbnails?: InvThumb[]
  formatStreams?: InvFormatStream[]
  recommendedVideos?: InvSearchItem[]
}

interface InvChannel {
  author: string
  authorId: string
  description?: string
  subCount?: number
  authorThumbnails?: InvThumb[]
  latestVideos?: InvSearchItem[]
}

export class RealVideoProvider implements VideoProvider {
  private instances: string[]

  constructor() {
    const raw = process.env.INVIDIOUS_INSTANCES
    this.instances = (raw ? raw.split(",") : DEFAULT_INSTANCES)
      .map((s) => s.trim().replace(/\/+$/, ""))
      .filter(Boolean)
    if (this.instances.length === 0) this.instances = DEFAULT_INSTANCES
  }

  // --- Низкоуровневый запрос с fallback по инстансам ------------------------
  private async fetchJson<T>(path: string): Promise<T> {
    let lastError: unknown = null
    for (const base of this.instances) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        const res = await fetch(`${base}${path}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        })
        clearTimeout(timer)
        if (!res.ok) {
          lastError = new Error(`${base} вернул ${res.status}`)
          continue
        }
        return (await res.json()) as T
      } catch (e) {
        clearTimeout(timer)
        lastError = e
        continue
      }
    }
    throw new Error(
      `Ни один Invidious-инстанс не ответил (${
        lastError instanceof Error ? lastError.message : "unknown"
      }). Проверьте INVIDIOUS_INSTANCES и доступ в сеть.`
    )
  }

  // --- Преобразования форматов --------------------------------------------
  private pickThumb(thumbs?: InvThumb[]): string {
    if (!thumbs || thumbs.length === 0) return ""
    const byQuality = (q: string) => thumbs.find((t) => t.quality === q)?.url
    return (
      byQuality("medium") ||
      byQuality("high") ||
      byQuality("sddefault") ||
      thumbs[Math.floor(thumbs.length / 2)]?.url ||
      thumbs[0].url
    )
  }

  private formatDuration(seconds?: number): string {
    const s = Math.max(0, Math.floor(seconds ?? 0))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (n: number) => String(n).padStart(2, "0")
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
  }

  private toIso(published?: number, fallbackText?: string): string {
    if (published && published > 0) return new Date(published * 1000).toISOString()
    return fallbackText ?? new Date(0).toISOString()
  }

  private itemToSummary(item: InvSearchItem): VideoSummary | null {
    if (!item.videoId || (item.type && item.type !== "video")) return null
    return {
      id: item.videoId,
      title: item.title ?? "",
      channelTitle: item.author ?? "",
      channelId: item.authorId ?? "",
      duration: this.formatDuration(item.lengthSeconds),
      thumbnail: this.pickThumb(item.videoThumbnails),
      views: item.viewCount ?? 0,
      publishedAt: this.toIso(item.published, item.publishedText),
    }
  }

  // Выбор совместимого с iOS 12 потока: muxed mp4 (H.264/AAC).
  private pickStream(streams?: InvFormatStream[]): {
    url: string | null
    mimeType: string | null
  } {
    if (!streams || streams.length === 0) return { url: null, mimeType: null }
    const isMp4 = (f: InvFormatStream) =>
      (f.container === "mp4" || /mp4/i.test(f.type)) &&
      /avc1|h264/i.test(f.type) &&
      /mp4a|aac/i.test(f.type)
    // Предпочтение: 720p (itag 22) → 360p (itag 18) → любой mp4 H.264/AAC.
    const byItag = (itag: string) =>
      streams.find((f) => f.itag === itag && isMp4(f))
    const chosen =
      byItag("22") ||
      byItag("18") ||
      streams.find(isMp4) ||
      // крайний fallback — любой muxed mp4-контейнер
      streams.find((f) => f.container === "mp4" || /mp4/i.test(f.type))
    if (!chosen) return { url: null, mimeType: null }
    return { url: chosen.url, mimeType: "video/mp4" }
  }

  // --- Публичные методы -------------------------------------------------
  async searchVideos(
    query: string,
    page: number,
    limit: number
  ): Promise<SearchResult> {
    const q = query.trim()
    if (!q) {
      // Пустой запрос — отдаём тренды как результаты.
      const trending = await this.getTrending(REGION, page, limit)
      return {
        query: q,
        page,
        limit,
        total: trending.length,
        hasMore: trending.length >= limit,
        results: trending,
      }
    }
    const data = await this.fetchJson<InvSearchItem[]>(
      `/api/v1/search?q=${encodeURIComponent(q)}&page=${page}&type=video&region=${REGION}`
    )
    const results = (data || [])
      .map((i) => this.itemToSummary(i))
      .filter((v): v is VideoSummary => v !== null)
      .slice(0, limit)
    // Invidious не отдаёт total; hasMore определяем по наполненности страницы.
    return {
      query: q,
      page,
      limit,
      total: results.length,
      hasMore: (data || []).length >= limit,
      results,
    }
  }

  async getVideo(id: string): Promise<VideoDetails | null> {
    if (!id) throw badRequest("Не указан id видео")
    const v = await this.fetchJson<InvVideo>(
      `/api/v1/videos/${encodeURIComponent(id)}`
    )
    if (!v || !v.videoId) return null
    return {
      id: v.videoId,
      title: v.title,
      channelTitle: v.author,
      channelId: v.authorId,
      duration: this.formatDuration(v.lengthSeconds),
      thumbnail: this.pickThumb(v.videoThumbnails),
      views: v.viewCount ?? 0,
      publishedAt: this.toIso(v.published, v.publishedText),
      description: v.description ?? "",
    }
  }

  async getChannel(id: string): Promise<Channel | null> {
    if (!id) throw badRequest("Не указан id канала")
    const c = await this.fetchJson<InvChannel>(
      `/api/v1/channels/${encodeURIComponent(id)}`
    )
    if (!c || !c.authorId) return null
    const videos = (c.latestVideos || [])
      .map((i) => this.itemToSummary(i))
      .filter((v): v is VideoSummary => v !== null)
    return {
      id: c.authorId,
      title: c.author,
      description: c.description ?? "",
      thumbnail: this.pickThumb(c.authorThumbnails),
      subscribers: c.subCount ?? 0,
      videos,
    }
  }

  async getStream(id: string): Promise<StreamInfo | null> {
    if (!id) throw badRequest("Не указан id видео")
    const v = await this.fetchJson<InvVideo>(
      `/api/v1/videos/${encodeURIComponent(id)}`
    )
    if (!v || !v.videoId) return null
    const { url, mimeType } = this.pickStream(v.formatStreams)
    return {
      id,
      streamUrl: url,
      mimeType,
      note: url
        ? "Invidious formatStreams: смуксированный mp4 (H.264/AAC), совместим с iOS 12."
        : "Для этого видео нет смуксированного mp4 (только DASH/VP9) — несовместимо с iOS 12.",
    }
  }

  async getTrending(
    region: string,
    page: number,
    limit: number
  ): Promise<VideoSummary[]> {
    const reg = (region || REGION).toUpperCase()
    const data = await this.fetchJson<InvSearchItem[]>(
      `/api/v1/trending?region=${encodeURIComponent(reg)}`
    )
    const all = (data || [])
      .map((i) => this.itemToSummary(i))
      .filter((v): v is VideoSummary => v !== null)
    const safePage = page < 1 ? 1 : page
    const safeLimit = limit < 1 ? 1 : limit
    const start = (safePage - 1) * safeLimit
    return all.slice(start, start + safeLimit)
  }

  async getRelated(id: string, limit: number): Promise<VideoSummary[]> {
    if (!id) throw badRequest("Не указан id видео")
    const v = await this.fetchJson<InvVideo>(
      `/api/v1/videos/${encodeURIComponent(id)}`
    )
    if (!v) throw notFound("Видео не найдено")
    return (v.recommendedVideos || [])
      .map((i) => this.itemToSummary({ ...i, type: "video" }))
      .filter((s): s is VideoSummary => s !== null)
      .slice(0, limit)
  }
}
