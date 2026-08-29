import { NextRequest, NextResponse } from 'next/server'
import { commitMDX, deleteMDX } from '@/lib/github'
import { buildMDX, slugify } from '@/lib/mdx'
import { getCollection, getEntry, isValidCollection, isSafeSlug, safeUrl } from '@/lib/collections'
import { authorized } from '@/lib/auth'
import type { CollectionEntry, CollectionName } from '@/types'

// Not every collection schema has a `title` field (e.g. "work" entries are
// identified by role + org). Fall back through other identifying fields so
// entries never collapse to the same generic "untitled" slug.
function deriveTitle(fields: Record<string, unknown>): string {
  const candidates = [fields.title, fields.role && fields.org ? `${fields.role} ${fields.org}` : fields.role, fields.name, fields.org]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c
  }
  return 'untitled'
}

// Guarantees the returned slug doesn't already belong to a different entry in
// the collection — without this, two entries that resolve to the same slug
// (blank titles, duplicate titles) silently overwrite each other on commit.
async function uniqueSlug(collection: CollectionName, title: string): Promise<string> {
  const base = slugify(title) || 'untitled'
  const existing = new Set((await getCollection(collection)).map((e) => e.slug))
  if (!existing.has(base)) return base
  let n = 2
  while (existing.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const collection = url.searchParams.get('collection')
  const slug = url.searchParams.get('slug')

  if (!collection) {
    return NextResponse.json({ error: 'Missing collection parameter' }, { status: 400 })
  }
  if (!isValidCollection(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 400 })
  }

  if (slug) {
    if (!isSafeSlug(slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    const entry = await getEntry<CollectionEntry>(collection as CollectionName, slug)
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(entry)
  }

  const entries = await getCollection<CollectionEntry>(collection as CollectionName)
  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  const { collection, slug: rawSlug, fields: rawFields, content } = body as {
    collection: string
    slug?: string
    fields: Record<string, unknown>
    content: string
  }

  if (!collection || !rawFields || content === undefined) {
    return NextResponse.json({ error: 'Missing collection, fields, or content' }, { status: 400 })
  }
  if (!isValidCollection(collection)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 400 })
  }
  if (rawSlug !== undefined && !isSafeSlug(rawSlug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  // strip identifiers/internals that the client may have round-tripped from a GET
  // response (e.g. `slug`, `_body`) — these are never legitimate frontmatter fields
  // and must not be written back into the file
  const { slug: _slug, content: _content, _body, ...fields } = rawFields as Record<string, unknown>

  // these fields are rendered straight into <a href> on public pages — reject a
  // javascript:/data: URI here rather than letting it become stored XSS
  for (const key of ['repo', 'url', 'credential_url']) {
    if (fields[key] && !safeUrl(fields[key])) {
      return NextResponse.json({ error: `${key} must be an http(s)/mailto URL` }, { status: 400 })
    }
  }

  try {
    const slug = rawSlug || await uniqueSlug(collection as CollectionName, deriveTitle(fields))
    const mdx  = buildMDX(fields, content)
    await commitMDX({ collection, slug, content: mdx })
    return NextResponse.json({ ok: true, slug }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { collection, slug } = await req.json() as { collection: string; slug: string }
  if (!collection || !slug) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  if (!isValidCollection(collection) || !isSafeSlug(slug)) {
    return NextResponse.json({ error: 'Invalid collection or slug' }, { status: 400 })
  }

  try {
    await deleteMDX({ collection, slug })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
