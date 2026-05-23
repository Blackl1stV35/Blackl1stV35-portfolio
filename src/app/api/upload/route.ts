import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

function authorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? ''
  return auth.startsWith('Bearer ') && auth.length > 20
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as 'cv' | 'portfolio' | null

  if (!file || !type) return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF only' }, { status: 415 })

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
