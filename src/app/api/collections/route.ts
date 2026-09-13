import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { commitMDX, deleteMDX, commitFile } from '@/lib/github'
import { buildMDX, slugify } from '@/lib/mdx'
import { getCollection, getEntry, isValidCollection, isSafeSlug, safeUrl } from '@/lib/collections'
import { authorized } from '@/lib/auth'
import type { CollectionEntry, CollectionName } from '@/types'

// GitHub's Contents API (a single base64 PUT) is only reliable for files up to
// a few MB — matches the cap the client already enforces in AvatarUpload/
// PicturesManager, but re-checked here since a client-side check is trivially
// bypassable.
const MAX_PICTURE_BYTES = 5 * 1024 * 1024
const MAX_PICTURES_PER_ENTRY = 10
const PICTURE_DATA_URL_RE = /^data:image\/(png|jpeg|jpg|gif|webp);base64,([a-zA-Z0-9+/]+=*)$/

// the client-declared MIME type in the data URL is just a label — check the
// actual file bytes so a relabelled non-image can't be committed to the repo
const PICTURE_MAGIC: Record<string, (buf: Buffer) => boolean> = {
  png:  (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  jpeg: (b) => b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  jpg:  (b) => b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  gif:  (b) => b.subarray(0, 4).toString('latin1') === 'GIF8',
  webp: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
}
const PICTURE_EXT: Record<string, string> = { png: 'png', jpeg: 'jpg', jpg: 'jpg', gif: 'gif', webp: 'webp' }

// Decodes a data URL, validates size/magic-bytes, and commits it to the repo
// under public/uploads/<collection>/<filename>.<ext>. Shared by the single
// cover-picture field (Books) and the multi-picture gallery (everything else).
async function decodeAndCommitPicture(collection: string, filePathBase: string, dataUrl: string): Promise<string> {
  const match = PICTURE_DATA_URL_RE.exec(dataUrl)
  if (!match) throw new Error('Invalid picture format')
  const [, mime, base64] = match
  // reject on the encoded string length before decoding — Buffer.from() below
  // allocates the full decoded size, so checking after decode would mean an
  // oversized payload already forced a large allocation just to be discarded
  if (base64.length > Math.ceil(MAX_PICTURE_BYTES * 4 / 3) + 4) {
    throw new Error(`Picture exceeds ${MAX_PICTURE_BYTES / (1024 * 1024)} MB limit`)
  }
  const buf = Buffer.from(base64, 'base64')
  if (buf.length > MAX_PICTURE_BYTES) throw new Error(`Picture exceeds ${MAX_PICTURE_BYTES / (1024 * 1024)} MB limit`)
  if (!PICTURE_MAGIC[mime]?.(buf)) throw new Error('Picture file content does not match its declared type')
  const ext = PICTURE_EXT[mime]
  const filePath = `public/uploads/${collection}/${filePathBase}.${ext}`
  await commitFile({ path: filePath, content: buf, message: `update(${collection}): ${filePathBase}` })
  return `/uploads/${collection}/${filePathBase}.${ext}`
}

// Books' single cover picture — stable filename, one per slug.
async function persistPicture(collection: string, slug: string, dataUrl: string): Promise<string> {
  return decodeAndCommitPicture(collection, slug, dataUrl)
}

// The multi-picture gallery (work/projects/publications/activity/achievement).
// Already-uploaded /uploads/<collection>/... URLs pass through untouched; any
// other non-data-URL string (typo, arbitrary external URL) is dropped rather
// than written verbatim into frontmatter — only this collection's own uploads
// or a freshly-picked data URL are legitimate values here.
//
// New pictures commit one at a time (not Promise.all): the GitHub Contents
// API resolves each PUT against the branch's current HEAD and then advances
// the branch ref, so concurrent PUTs to the same branch — even at distinct
// paths — can race on that ref update and 409. Sequential commits avoid that
// at the cost of some latency.
async function persistPictures(collection: string, slug: string, pictures: unknown): Promise<{ pictures: string[]; truncated: boolean }> {
  if (!Array.isArray(pictures)) return { pictures: [], truncated: false }
  const strings = pictures.filter((p): p is string => typeof p === 'string')
  const truncated = strings.length > MAX_PICTURES_PER_ENTRY
  const capped = strings.slice(0, MAX_PICTURES_PER_ENTRY)
  const out: string[] = []
  for (const pic of capped) {
    if (pic.startsWith('data:image/')) {
      const suffix = crypto.randomBytes(4).toString('hex')
      out.push(await decodeAndCommitPicture(collection, `${slug}-${suffix}`, pic))
    } else if (pic.startsWith(`/uploads/${collection}/`)) {
      out.push(pic)
    }
  }
  return { pictures: out, truncated }
}

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

// Worst case is a full gallery of MAX_PICTURES_PER_ENTRY pictures, each at
// MAX_PICTURE_BYTES and inflated ~4/3 by base64, plus JSON/text overhead —
// reject on the declared Content-Length before buffering/parsing the body, so
// an oversized request can't force a large allocation just to be rejected
// after the fact.
const MAX_REQUEST_BYTES = Math.ceil(MAX_PICTURES_PER_ENTRY * MAX_PICTURE_BYTES * 4 / 3) + 1024 * 1024

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const declaredLength = Number(req.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: `Request exceeds ${MAX_REQUEST_BYTES / (1024 * 1024)} MB limit` }, { status: 413 })
  }

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
    if (typeof fields.picture === 'string' && fields.picture.startsWith('data:image/')) {
      fields.picture = await persistPicture(collection, slug, fields.picture)
    }
    let picturesTruncated = false
    if (Array.isArray(fields.pictures)) {
      const result = await persistPictures(collection, slug, fields.pictures)
      fields.pictures = result.pictures
      picturesTruncated = result.truncated
    }
    const mdx  = buildMDX(fields, content)
    await commitMDX({ collection, slug, content: mdx })
    return NextResponse.json({
      ok: true,
      slug,
      ...(picturesTruncated ? { warning: `Only the first ${MAX_PICTURES_PER_ENTRY} pictures were kept.` } : {}),
    }, { status: 200 })
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
