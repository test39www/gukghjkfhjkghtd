import "dotenv/config"
import cors from "cors"
import express, { NextFunction, Request, Response } from "express"
import rateLimit from "express-rate-limit"
import { apiRouter } from "./routes"
import { ApiError } from "./utils/errors"

const app = express()
const PORT = Number(process.env.PORT ?? 4000)

const origins = (process.env.CORS_ORIGIN ?? "*")
  .split(",")
  .map((s) => s.trim())
app.use(cors({ origin: origins.includes("*") ? "*" : origins }))
app.use(express.json())

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 60),
  standardHeaders: true,
  legacyHeaders: false,
})
app.use("/api", limiter, apiRouter)

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" })
})

// Централизованный обработчик ошибок
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof ApiError ? err.status : 500
  const message =
    err instanceof Error ? err.message : "Internal server error"
  if (status >= 500) console.error(err)
  res.status(status).json({ error: message })
})

app.listen(PORT, () => {
  console.log(`Backend запущен: http://localhost:${PORT}`)
})
