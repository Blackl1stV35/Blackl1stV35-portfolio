// Server-side only
import crypto from 'crypto'
import type { NextRequest } from 'next/server'

interface AttemptRecord { count: number; lockedUntil: number }
const store = new Map<string, AttemptRecord>()

const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

export type AuthResult =
  | { status: 'ok' }
  | { status: 'locked' }
  | { status: 'missing_env' }
  | { status: 'invalid'; remaining: number }

export function validateToken(token: string, ip: string): AuthResult {
  const secret = process.env.ADMIN_TOKEN
  if (!secret) return { status: 'missing_env' }

  if (!store.has(ip)) store.set(ip, { count: 0, lockedUntil: 0 })
  const rec = store.get(ip)!

  if (Date.now() < rec.lockedUntil) return { status: 'locked' }

  if (token === secret) {
    store.delete(ip)
    return { status: 'ok' }
  }

  rec.count += 1
  if (rec.count >= MAX_ATTEMPTS) rec.lockedUntil = Date.now() + LOCK_MS
  store.set(ip, rec)
  // remaining is computed AFTER incrementing
  const remaining = Math.max(0, MAX_ATTEMPTS - rec.count)
  return { status: 'invalid', remaining }
}

// Sessions are HMAC-signed (not stored server-side) so verification works
// across separate serverless invocations, unlike an in-memory session map.
export function issueSession(ip: string): string {
  const secret = process.env.ADMIN_TOKEN ?? ''
  const payload = `${ip}:${Date.now()}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

const SHA256_HEX_LEN = 64 // crypto.createHmac('sha256', ...).digest('hex').length

// Parses from the right using the signature's fixed hex length, rather than
// splitting on ":" — an IPv6 client address (e.g. "2001:db8::1") contains
// colons itself, so a naive 3-part split on "ip:ts:sig" breaks verification
// for any IPv6 visitor (every request 401s even with a freshly issued session).
function verifySession(session: string): boolean {
  const secret = process.env.ADMIN_TOKEN
  if (!secret || !session) return false
  try {
    const decoded = Buffer.from(session, 'base64url').toString('utf8')
    if (decoded.length <= SHA256_HEX_LEN + 1 || decoded[decoded.length - SHA256_HEX_LEN - 1] !== ':') return false
    const sig = decoded.slice(-SHA256_HEX_LEN)
    const payload = decoded.slice(0, -SHA256_HEX_LEN - 1) // the exact string that was signed: "ip:ts"
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    const sigBuf = Buffer.from(sig, 'hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    if (sigBuf.length !== 32 || expectedBuf.length !== 32 || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return false
    const tsIdx = payload.lastIndexOf(':')
    if (tsIdx === -1) return false
    const age = Date.now() - Number(payload.slice(tsIdx + 1))
    return Number.isFinite(age) && age >= 0 && age < SESSION_TTL_MS
  } catch {
    return false
  }
}

// Shared authorization check for every admin API route — verifies the
// Authorization: Bearer <session> header against a real signed session
// instead of just checking the string's length.
export function authorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return false
  return verifySession(auth.slice('Bearer '.length))
}
