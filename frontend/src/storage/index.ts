import AsyncStorage from "@react-native-async-storage/async-storage"
import { Account, Subscription, VideoSummary } from "../types"

const KEYS = {
  backendUrl: "settings:backendUrl",
  region: "settings:region",
  session: "auth:session",
  accounts: "auth:accounts",
}

// Значение по умолчанию: замените на IP вашего backend в локальной сети.
export const DEFAULT_BACKEND_URL = "http://192.168.1.100:4000"
export const DEFAULT_REGION = "US"
const HISTORY_LIMIT = 50
const GUEST = "guest"

// --- Backend URL -----------------------------------------------------------
export async function getBackendUrl(): Promise<string> {
  const v = await AsyncStorage.getItem(KEYS.backendUrl)
  return v ?? DEFAULT_BACKEND_URL
}

export async function setBackendUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.backendUrl, url.trim())
}

// --- Регион рекомендаций --------------------------------------------------
export async function getRegion(): Promise<string> {
  const v = await AsyncStorage.getItem(KEYS.region)
  return v ?? DEFAULT_REGION
}

export async function setRegion(region: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.region, region.trim().toUpperCase())
}

// --- Аккаунты (локальные) ---------------------------------------------
// Важно: это ЛОКАЛЬНЫй аккаунт на устройстве (без Google/сервера),
// нужен для разделения истории/избранного/подписок между профилями.
// Пароль хранится как простой хеш (не криптостойкий) — только от случайного доступа.
interface StoredAccount {
  username: string
  passHash: string
  createdAt: string
}

function hashPassword(password: string): string {
  // djb2 — простой детерминированный хеш без внешних зависимостей.
  let h = 5381
  for (let i = 0; i < password.length; i++) {
    h = (h * 33) ^ password.charCodeAt(i)
  }
  return (h >>> 0).toString(16)
}

async function readAccounts(): Promise<StoredAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.accounts)
    return raw ? (JSON.parse(raw) as StoredAccount[]) : []
  } catch {
    return []
  }
}

async function writeAccounts(list: StoredAccount[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.accounts, JSON.stringify(list))
}

function toPublic(a: StoredAccount): Account {
  return { username: a.username, createdAt: a.createdAt }
}

export async function listAccounts(): Promise<Account[]> {
  return (await readAccounts()).map(toPublic)
}

/** Регистрация нового локального аккаунта + автовход. */
export async function register(
  username: string,
  password: string
): Promise<Account> {
  const name = username.trim()
  if (name.length < 2) throw new Error("Имя должно быть не короче 2 символов.")
  if (name.toLowerCase() === GUEST) throw new Error("Это имя зарезервировано.")
  if (password.length < 4)
    throw new Error("Пароль должен быть не короче 4 символов.")
  const list = await readAccounts()
  if (list.some((a) => a.username.toLowerCase() === name.toLowerCase()))
    throw new Error("Аккаунт с таким именем уже существует.")
  const account: StoredAccount = {
    username: name,
    passHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  await writeAccounts([...list, account])
  await AsyncStorage.setItem(KEYS.session, name)
  return toPublic(account)
}

/** Вход в существующий аккаунт. */
export async function login(
  username: string,
  password: string
): Promise<Account> {
  const name = username.trim()
  const list = await readAccounts()
  const found = list.find(
    (a) => a.username.toLowerCase() === name.toLowerCase()
  )
  if (!found) throw new Error("Аккаунт не найден.")
  if (found.passHash !== hashPassword(password))
    throw new Error("Неверный пароль.")
  await AsyncStorage.setItem(KEYS.session, found.username)
  return toPublic(found)
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.session)
}

export async function getSession(): Promise<Account | null> {
  const name = await AsyncStorage.getItem(KEYS.session)
  if (!name) return null
  const list = await readAccounts()
  const found = list.find((a) => a.username === name)
  return found ? toPublic(found) : null
}

async function currentUser(): Promise<string> {
  const name = await AsyncStorage.getItem(KEYS.session)
  return name || GUEST
}

// --- Пользовательские данные (намеспейс по аккаунту) --------------------
function nsKey(kind: string, user: string): string {
  return `data:${kind}:${user}`
}

async function readList<T>(kind: string): Promise<T[]> {
  try {
    const user = await currentUser()
    const raw = await AsyncStorage.getItem(nsKey(kind, user))
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

async function writeList<T>(kind: string, list: T[]): Promise<void> {
  const user = await currentUser()
  await AsyncStorage.setItem(nsKey(kind, user), JSON.stringify(list))
}

// --- История ---------------------------------------------------------------
export const getHistory = () => readList<VideoSummary>("history")

export async function addToHistory(video: VideoSummary): Promise<void> {
  const list = await readList<VideoSummary>("history")
  const filtered = list.filter((v) => v.id !== video.id)
  filtered.unshift(video)
  await writeList("history", filtered.slice(0, HISTORY_LIMIT))
}

export const clearHistory = async () =>
  writeList<VideoSummary>("history", [])

// --- Избранное -------------------------------------------------------------
export const getFavorites = () => readList<VideoSummary>("favorites")

export async function isFavorite(id: string): Promise<boolean> {
  const list = await readList<VideoSummary>("favorites")
  return list.some((v) => v.id === id)
}

/** Переключает избранное. Возвращает новое состояние (true = в избранном). */
export async function toggleFavorite(video: VideoSummary): Promise<boolean> {
  const list = await readList<VideoSummary>("favorites")
  const exists = list.some((v) => v.id === video.id)
  const next = exists
    ? list.filter((v) => v.id !== video.id)
    : [video, ...list]
  await writeList("favorites", next)
  return !exists
}

export const clearFavorites = async () =>
  writeList<VideoSummary>("favorites", [])

// --- Подписки -------------------------------------------------------------
export const getSubscriptions = () => readList<Subscription>("subscriptions")

export async function isSubscribed(channelId: string): Promise<boolean> {
  const list = await readList<Subscription>("subscriptions")
  return list.some((s) => s.channelId === channelId)
}

/** Переключает подписку. Возвращает новое состояние (true = подписан). */
export async function toggleSubscription(sub: Subscription): Promise<boolean> {
  if (!sub.channelId) return false
  const list = await readList<Subscription>("subscriptions")
  const exists = list.some((s) => s.channelId === sub.channelId)
  const next = exists
    ? list.filter((s) => s.channelId !== sub.channelId)
    : [sub, ...list]
  await writeList("subscriptions", next)
  return !exists
}

export const clearSubscriptions = async () =>
  writeList<Subscription>("subscriptions", [])
