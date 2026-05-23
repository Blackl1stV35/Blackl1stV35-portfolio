import fs from 'fs/promises'
import path from 'path'

type CacheEntry<T> = { value: T; expiresAt: number }

const cache = new Map<string, CacheEntry<any>>()

export async function readJSON<T = any>(filePath: string, ttl = 5000): Promise<T> {
  const key = `json:${filePath}`
  const now = Date.now()
  const existing = cache.get(key)
  if (existing && existing.expiresAt > now) return existing.value as T

  async function fetchGitHubJSON(): Promise<T | null> {
    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH ?? 'master'
    if (!token || !owner || !repo) return null

    const repoPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')
    if (!repoPath || repoPath.startsWith('..')) return null

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}?ref=${branch}`
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      })
      if (!res.ok) return null
      const json = await res.json()
      if (!json?.content) return null
      const raw = Buffer.from(json.content, 'base64').toString('utf8')
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  try {
    const parsed = await fetchGitHubJSON().catch(() => null) ?? JSON.parse(await fs.readFile(filePath, 'utf-8')) as T
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
