import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { CollectionName, BaseEntry } from '@/types'

const COLLECTIONS_DIR = path.join(process.cwd(), 'collections')

export function getCollection<T extends BaseEntry>(name: CollectionName): T[] {
  const dir = path.join(COLLECTIONS_DIR, name)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
      const { data, content } = matter(raw)
      return {
        slug: file.replace(/\.mdx?$/, ''),
        content,
        ...data,
      } as T
    })
    .sort((a, b) => {
      if (!a.date || !b.date) return 0
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
}

export function getEntry<T extends BaseEntry>(name: CollectionName, slug: string): T | null {
  const file = path.join(COLLECTIONS_DIR, name, `${slug}.mdx`)
  const fallback = path.join(COLLECTIONS_DIR, name, `${slug}.md`)
  const target = fs.existsSync(file) ? file : fs.existsSync(fallback) ? fallback : null
  if (!target) return null
  const raw = fs.readFileSync(target, 'utf-8')
  const { data, content } = matter(raw)
  return { slug, content, ...data } as T
}
