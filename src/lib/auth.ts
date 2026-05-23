// Server-side only — never imported in client components

const attempts = new Map<string, { count: number; lockedUntil: number }>()

const MAX_ATTEMPTS = 5
const LOCK_MS = 15 * 60 * 1000 // 15 minutes

export function validateToken(token: string, ip: string): 'ok' | 'invalid' | 'locked' | 'missing_env' {
  const secret = process.env.ADMIN_TOKEN
  if (!secret) return 'missing_env'

  const record = attempts.get(ip) ?? { count: 0, lockedUntil: 0 }

  if (Date.now() < record.lockedUntil) return 'locked'

  if (token === secret) {
    attempts.delete(ip)
    return 'ok'
  }

  record.count += 1
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_MS
  }
  attempts.set(ip, record)
  return 'invalid'
}

export function getRemainingAttempts(ip: string): number {
  const record = attempts.get(ip)
  if (!record) return MAX_ATTEMPTS
  return Math.max(0, MAX_ATTEMPTS - record.count)
}
