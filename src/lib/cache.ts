import fs from 'fs/promises'

type CacheEntry<T> = { value: T; expiresAt: number }

const cache = new Map<string, CacheEntry<any>>()

export async function readJSON<T = any>(filePath: string, ttl = 5000): Promise<T> {
  const key = `json:${filePath}`
  const now = Date.now()
  const existing = cache.get(key)
  if (existing && existing.expiresAt > now) return existing.value as T

  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as T
    cache.set(key, { value: parsed, expiresAt: now + ttl })
    return parsed
  } catch (err) {
    throw err
  }
}

export async function readFileCached(filePath: string, ttl = 5000): Promise<string> {
  const key = `file:${filePath}`
  const now = Date.now()
  const existing = cache.get(key)
  if (existing && existing.expiresAt > now) return existing.value as string
  const raw = await fs.readFile(filePath, 'utf-8')
  cache.set(key, { value: raw, expiresAt: now + ttl })
  return raw
}

export function invalidate(filePath: string) {
  cache.delete(`json:${filePath}`)
  cache.delete(`file:${filePath}`)
}
