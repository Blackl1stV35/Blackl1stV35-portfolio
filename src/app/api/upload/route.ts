import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { authorized } from '@/lib/auth'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20 MB
const PDF_MAGIC = '%PDF-'

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type')

  if (!file || (type !== 'cv' && type !== 'portfolio')) {
    return NextResponse.json({ error: 'Missing file, or type must be "cv" or "portfolio"' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit` }, { status: 413 })
  }
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF only' }, { status: 415 })

  // the client-declared MIME type is just a label — check the actual file bytes
  // so a renamed/relabelled non-PDF can't be published as cv.pdf/portfolio.pdf
  const head = Buffer.from(await file.slice(0, PDF_MAGIC.length).arrayBuffer())
  if (head.toString('latin1') !== PDF_MAGIC) {
    return NextResponse.json({ error: 'File is not a valid PDF' }, { status: 415 })
  }

  const filename = type === 'cv' ? 'cv.pdf' : 'portfolio.pdf'

  try {
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })
    return NextResponse.json({ ok: true, url: blob.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
