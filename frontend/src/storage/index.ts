import AsyncStorage from "@react-native-async-storage/async-storage"
import { VideoSummary } from "../types"

const KEYS = {
  backendUrl: "settings:backendUrl",
  history: "data:history",
  favorites: "data:favorites",
}

// Значение по умолчанию: замените на IP вашего backend в локальной сети.
export const DEFAULT_BACKEND_URL = "http://144.124.245.166:4000"
const HISTORY_LIMIT = 50

// --- Backend URL -----------------------------------------------------------
export async function getBackendUrl(): Promise<string> {
  const v = await AsyncStorage.getItem(KEYS.backendUrl)
  return v ?? DEFAULT_BACKEND_URL
}

export async function setBackendUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.backendUrl, url.trim())
}

// --- Внутренний помощник ---------------------------------------------------
async function readList(key: string): Promise<VideoSummary[]> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? (JSON.parse(raw) as VideoSummary[]) : []
  } catch {
    return []
  }
}

async function writeList(key: string, list: VideoSummary[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(list))
}

// --- История ---------------------------------------------------------------
export const getHistory = () => readList(KEYS.history)

export async function addToHistory(video: VideoSummary): Promise<void> {
  const list = await readList(KEYS.history)
  const filtered = list.filter((v) => v.id !== video.id)
  filtered.unshift(video)
  await writeList(KEYS.history, filtered.slice(0, HISTORY_LIMIT))
}

export const clearHistory = () => AsyncStorage.removeItem(KEYS.history)

// --- Избранное -------------------------------------------------------------
export const getFavorites = () => readList(KEYS.favorites)

export async function isFavorite(id: string): Promise<boolean> {
  const list = await readList(KEYS.favorites)
  return list.some((v) => v.id === id)
}

/** Переключает избранное. Возвращает новое состояние (true = в избранном). */
export async function toggleFavorite(video: VideoSummary): Promise<boolean> {
  const list = await readList(KEYS.favorites)
  const exists = list.some((v) => v.id === video.id)
  const next = exists
    ? list.filter((v) => v.id !== video.id)
    : [video, ...list]
  await writeList(KEYS.favorites, next)
  return !exists
}
