// Server-side only — never imported in client components

interface Record { count: number; lockedUntil: number }
const store = new Map<string, Record>()

const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000

export function validateToken(token: string, ip: string): 'ok' | 'invalid' | 'locked' | 'missing_env' {
  const secret = process.env.ADMIN_TOKEN
  if (!secret) return 'missing_env'

  // Ensure record exists before reading
  if (!store.has(ip)) store.set(ip, { count: 0, lockedUntil: 0 })
  const rec = store.get(ip)!

  if (Date.now() < rec.lockedUntil) return 'locked'

  if (token === secret) {
    store.delete(ip)
    return 'ok'
  }

  // Increment first, then check threshold
  rec.count += 1
  if (rec.count >= MAX_ATTEMPTS) rec.lockedUntil = Date.now() + LOCK_MS
  store.set(ip, rec)
  return 'invalid'
}

// Returns attempts LEFT (not used — count returned directly from route now)
export function getRemainingAttempts(ip: string): number {
  const rec = store.get(ip)
  if (!rec) return MAX_ATTEMPTS
  return Math.max(0, MAX_ATTEMPTS - rec.count)
}
