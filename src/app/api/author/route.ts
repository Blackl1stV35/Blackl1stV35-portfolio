import { NextRequest, NextResponse } from 'next/server'
import { commitFile } from '@/lib/github'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  return auth.startsWith('Bearer ') && auth.length > 20
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  try {
    await commitFile({
      path: 'content/author.json',
      content: JSON.stringify(body, null, 2),
      message: 'update: author profile',
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
