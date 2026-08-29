import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { CollectionName, BaseEntry } from '@/types'
import { readFileCached, invalidate } from './cache'

const COLLECTIONS_DIR = path.join(process.cwd(), 'collections')

const VALID_COLLECTIONS = new Set<string>(['projects', 'work', 'publications', 'books', 'activity', 'achievement'])

export function isValidCollection(name: string): name is CollectionName {
  return VALID_COLLECTIONS.has(name)
}

// Slugs become filenames (locally and via the GitHub Contents API), so they
// must not contain path separators or ".." segments — otherwise a crafted
// `collection`/`slug` pair can read or write outside the collections dir.
export function isSafeSlug(slug: string): boolean {
  return typeof slug === 'string' && slug.length > 0 && slug.length < 200 && !/[\\/]/.test(slug) && slug !== '.' && slug !== '..'
}

const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:'])

// Admin-authored link fields (repo, url, credential_url) get rendered straight
// into <a href>. Without an allowlist, a "javascript:" value saved through the
// CMS would execute in every visitor's browser on click — a stored XSS vector.
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed || !/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return undefined
  try {
    return SAFE_URL_SCHEMES.has(new URL(trimmed).protocol) ? trimmed : undefined
  } catch {
    return undefined
  }
}

function normalizeArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String).filter(Boolean)
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

function normalizeEntry<T extends BaseEntry>(entry: T): T {
  const validStatus = (s: unknown): s is 'green' | 'yellow' | 'red' => s === 'green' || s === 'yellow' || s === 'red'
  // gray-matter's YAML parser auto-coerces an unquoted date-like scalar (e.g. an
  // frontmatter field hand-edited directly on GitHub as `start: 2024-01-01`) into
  // a real Date object. Every field here is meant to render as text, and React
  // throws trying to render a bare Date as a child — coerce it back to a string.
  const stringified = Object.fromEntries(
    Object.entries(entry).map(([k, v]) => [k, v instanceof Date ? v.toISOString().split('T')[0] : v])
  )
  return {
    ...entry,
    ...stringified,
    status: validStatus(entry.status) ? entry.status : 'green',
    tags: normalizeArray((entry as any).tags),
    stack: normalizeArray((entry as any).stack),
  } as T
}

export async function getCollection<T extends BaseEntry>(name: CollectionName): Promise<T[]> {
  if (!isValidCollection(name)) return []
  const dir = path.join(COLLECTIONS_DIR, name)
  try {
    await fs.promises.access(dir)
  } catch { return [] }

  const files = await fs.promises.readdir(dir)
  const entries: T[] = []
  for (const file of files.filter(f => f.endsWith('.mdx') || f.endsWith('.md'))) {
    const filePath = path.join(dir, file)
    try {
      const raw = await readFileCached(filePath, 10000)
      const { data, content } = matter(raw)
      // slug must always come from the filename — spreading it last means a stray
      // `slug` field in frontmatter can never shadow the file's real identity
      entries.push(normalizeEntry({ ...data, content, slug: file.replace(/\.mdx?$/, '') } as T))
    } catch (err) {
      console.warn(`[collections] Failed to parse ${file}:`, err instanceof Error ? err.message : err)
      // skip malformed entries
    }
  }
  return entries.sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

export async function getEntry<T extends BaseEntry>(name: CollectionName, slug: string): Promise<T | null> {
  if (!isValidCollection(name) || !isSafeSlug(slug)) return null
  const file = path.join(COLLECTIONS_DIR, name, `${slug}.mdx`)
  const fallback = path.join(COLLECTIONS_DIR, name, `${slug}.md`)
  let target: string | null = null
  try { await fs.promises.access(file); target = file } catch { try { await fs.promises.access(fallback); target = fallback } catch {} }
  if (!target) return null
  try {
    const raw = await readFileCached(target, 10000)
    const { data, content } = matter(raw)
    return normalizeEntry({ ...data, content, slug } as T)
  } catch (err) {
    console.warn(`[collections] Failed to parse entry ${slug}:`, err instanceof Error ? err.message : err)
    return null
  }
}

export function evictCollection(name: CollectionName) {
  // naive: invalidate all files in collection
  try {
    const dir = path.join(COLLECTIONS_DIR, name)
    const files = fs.readdirSync(dir)
    for (const f of files) {
      invalidate(path.join(dir, f))
    }
  } catch {}
}
