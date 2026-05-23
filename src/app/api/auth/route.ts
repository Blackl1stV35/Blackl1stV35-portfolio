import { NextRequest, NextResponse } from 'next/server'
import { validateToken, getRemainingAttempts } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'

  let token: string
  try {
    const body = await req.json()
    token = body.token ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = validateToken(token, ip)

  if (result === 'missing_env') {
    return NextResponse.json({ error: 'Server misconfigured: ADMIN_TOKEN not set' }, { status: 500 })
  }

  if (result === 'locked') {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  if (result === 'invalid') {
    const remaining = getRemainingAttempts(ip)
    return NextResponse.json(
      { error: 'Incorrect token', remaining },
      { status: 401 }
    )
  }

  // Generate a short-lived session token (stored client-side in sessionStorage only)
  const session = Buffer.from(`${ip}:${Date.now()}:${Math.random()}`).toString('base64')

  return NextResponse.json({ ok: true, session }, { status: 200 })
}
