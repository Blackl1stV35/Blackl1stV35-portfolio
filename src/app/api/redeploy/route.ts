import { NextRequest, NextResponse } from 'next/server'

function authorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  return auth.startsWith('Bearer ') && auth.length > 20
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hook = process.env.VERCEL_DEPLOY_HOOK
  if (!hook) return NextResponse.json({ error: 'No deploy hook configured' }, { status: 404 })

  try {
    const res = await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    if (!res.ok) return NextResponse.json({ error: `Hook ${res.status}` }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
