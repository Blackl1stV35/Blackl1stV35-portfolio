import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { CollectionName, BaseEntry } from '@/types'
import { readFileCached, invalidate } from './cache'

const COLLECTIONS_DIR = path.join(process.cwd(), 'collections')

function normalizeArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(String).filter(Boolean)
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

function normalizeEntry<T extends BaseEntry>(entry: T): T {
  const validStatus = (s: unknown): s is 'green' | 'yellow' | 'red' => s === 'green' || s === 'yellow' || s === 'red'
  return {
    ...entry,
    status: validStatus(entry.status) ? entry.status : 'green',
    tags: normalizeArray((entry as any).tags),
    stack: normalizeArray((entry as any).stack),
  } as T
}

export async function getCollection<T extends BaseEntry>(name: CollectionName): Promise<T[]> {
  const dir = path.join(COLLECTIONS_DIR, name)
  try {
    await fs.promises.access(dir)
  } catch { return [] }

  const files = await fs.promises.readdir(dir)
  const entries: T[] = []
  for (const file of files.filter(f => f.endsWith('.mdx') || f.endsWith('.md'))) {
    const filePath = path.join(dir, file)
    const raw = await readFileCached(filePath, 10000)
    const { data, content } = matter(raw)
    entries.push(normalizeEntry({ slug: file.replace(/\.mdx?$/, ''), content, ...data } as T))
  }
  return entries.sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

export async function getEntry<T extends BaseEntry>(name: CollectionName, slug: string): Promise<T | null> {
  const file = path.join(COLLECTIONS_DIR, name, `${slug}.mdx`)
  const fallback = path.join(COLLECTIONS_DIR, name, `${slug}.md`)
  let target: string | null = null
  try { await fs.promises.access(file); target = file } catch { try { await fs.promises.access(fallback); target = fallback } catch {} }
  if (!target) return null
  const raw = await readFileCached(target, 10000)
  const { data, content } = matter(raw)
  return normalizeEntry({ slug, content, ...data } as T)
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
