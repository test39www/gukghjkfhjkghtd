interface CacheEntry<T> {
  value: T
  expiresAt: number
}

/** Простой in-memory кэш с TTL. */
export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  constructor(private ttlSeconds: number) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.ttlSeconds) * 1000
    this.store.set(key, { value, expiresAt: Date.now() + ttl })
  }

  /** Возвращает из кэша либо вычисляет, кэширует и возвращает. */
  async wrap<T>(key: string, producer: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) return cached
    const value = await producer()
    this.set(key, value)
    return value
  }
}
