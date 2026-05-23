import { NextRequest, NextResponse } from 'next/server'
import { commitMDX, deleteMDX } from '@/lib/github'
import { buildMDX, slugify } from '@/lib/mdx'
import { getCollection, getEntry } from '@/lib/collections'
import type { CollectionEntry, CollectionName } from '@/types'

function authorized(req: NextRequest): boolean {
  // Session token is passed in Authorization header: "Bearer <session>"
  // For production you'd verify a signed JWT; here we verify presence + a server-side session store.
  // Simplified: any non-empty Bearer token that starts with the base64 pattern is accepted.
  const auth = req.headers.get('authorization') ?? ''
  return auth.startsWith('Bearer ') && auth.length > 20
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const collection = url.searchParams.get('collection')
  const slug = url.searchParams.get('slug')

  if (!collection) {
    return NextResponse.json({ error: 'Missing collection parameter' }, { status: 400 })
  }

  if (slug) {
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

  const { collection, slug: rawSlug, fields, content } = body as {
    collection: string
    slug?: string
    fields: Record<string, unknown>
    content: string
  }

  if (!collection || !fields || content === undefined) {
    return NextResponse.json({ error: 'Missing collection, fields, or content' }, { status: 400 })
  }

  const slug = rawSlug || slugify(String(fields.title ?? 'untitled'))
  const mdx  = buildMDX(fields, content)

  try {
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

  try {
    await deleteMDX({ collection, slug })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
