import { NextRequest, NextResponse } from 'next/server'
import { authorized } from '@/lib/auth'
import { commitFile } from '@/lib/github'

// GitHub's Contents API (a single base64 PUT) is only reliable for files up to
// a few MB — a resume PDF is comfortably under this, and it keeps uploads well
// inside that ceiling without needing the separate Git Data (blob) API.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const PDF_MAGIC = '%PDF-'

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type')

  if (!file || type !== 'cv') {
    return NextResponse.json({ error: 'Missing file, or type must be "cv"' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit` }, { status: 413 })
  }
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF only' }, { status: 415 })

  const buf = Buffer.from(await file.arrayBuffer())

  // the client-declared MIME type is just a label — check the actual file bytes
  // so a renamed/relabelled non-PDF can't be published as the site's CV
  if (buf.subarray(0, PDF_MAGIC.length).toString('latin1') !== PDF_MAGIC) {
    return NextResponse.json({ error: 'File is not a valid PDF' }, { status: 415 })
  }

  try {
    // matches every other admin write in this app: commit via the GitHub
    // Contents API, then the client triggers /api/redeploy. public/cv.pdf is a
    // build-time static asset, so it only updates on the site after that
    // rebuild — same ~30s delay as every other content change here.
    await commitFile({
      path: 'public/cv.pdf',
      content: buf,
      message: 'update: CV/resume',
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
