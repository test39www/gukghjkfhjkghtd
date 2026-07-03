import { Router } from "express"
import { MemoryCache } from "../services/cache"
import * as yt from "../services/youtubeService"
import { notFound } from "../utils/errors"

const ttl = Number(process.env.CACHE_TTL_SECONDS ?? 600)
const cache = new MemoryCache(ttl)

export const apiRouter = Router()

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    dataSource: process.env.DATA_SOURCE ?? "mock",
  })
})

apiRouter.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "")
    const page = Math.max(1, Number(req.query.page ?? 1) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10) || 10))
    const result = await cache.wrap(`search:${q}:${page}:${limit}`, () =>
      yt.searchVideos(q, page, limit)
    )
    res.json(result)
  } catch (e) {
    next(e)
  }
})

// Метаданные видео (без ссылки на воспроизведение).
apiRouter.get("/video/:id", async (req, res, next) => {
  try {
    const video = await cache.wrap(`video:${req.params.id}`, () =>
      yt.getVideo(req.params.id)
    )
    if (!video) throw notFound("Видео не найдено")
    res.json(video)
  } catch (e) {
    next(e)
  }
})

apiRouter.get("/channel/:id", async (req, res, next) => {
  try {
    const channel = await cache.wrap(`channel:${req.params.id}`, () =>
      yt.getChannel(req.params.id)
    )
    if (!channel) throw notFound("Канал не найден")
    res.json(channel)
  } catch (e) {
    next(e)
  }
})

// Ссылка на воспроизведение — отдельно от метаданных.
apiRouter.get("/stream/:id", async (req, res, next) => {
  try {
    const stream = await cache.wrap(`stream:${req.params.id}`, () =>
      yt.getStream(req.params.id)
    )
    if (!stream) throw notFound("Поток не найден")
    res.json(stream)
  } catch (e) {
    next(e)
  }
})
