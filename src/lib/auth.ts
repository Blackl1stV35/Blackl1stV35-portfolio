// Server-side only

interface AttemptRecord { count: number; lockedUntil: number }
const store = new Map<string, AttemptRecord>()

const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

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
