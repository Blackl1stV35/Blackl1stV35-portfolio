// GitHub Contents API — server-side only
import fs from 'fs'
import path from 'path'
import { invalidate } from './cache'
import { evictCollection, isValidCollection, isSafeSlug } from './collections'

function getEnv() {
  const token  = process.env.GITHUB_TOKEN
  const owner  = process.env.GITHUB_OWNER
  const repo   = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH ?? 'master'
  if (!token || !owner || !repo) throw new Error('Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO env vars')
  return { token, owner, repo, branch }
}

async function writeLocalFile(filePath: string, content: string) {
  const localPath = path.join(process.cwd(), filePath)
  try {
    await fs.promises.mkdir(path.dirname(localPath), { recursive: true })
    await fs.promises.writeFile(localPath, content, 'utf8')
  } catch (err) {
    console.warn('[github] local write skipped', filePath, err instanceof Error ? err.message : err)
  }
}

// Returns undefined only for a confirmed 404 ("file doesn't exist"). Any other
// failure (network error, rate limit, 5xx) throws, so callers can tell "the
// file really isn't there" apart from "we couldn't check" — conflating the two
// previously made deleteMDX report "File not found" for a transient API blip.
async function getFileSHA(apiUrl: string, token: string): Promise<string | undefined> {
  const r = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  if (r.status === 404) return undefined
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`)
  return (await r.json()).sha
}

export async function commitMDX({ collection, slug, content }: {
  collection: string; slug: string; content: string
}) {
  if (!isValidCollection(collection) || !isSafeSlug(slug)) throw new Error('Invalid collection or slug')
  return commitFile({
    path: `collections/${collection}/${slug}.mdx`,
    content,
    message: `update(${collection}): ${slug}`,
  })
}

export async function deleteMDX({ collection, slug }: { collection: string; slug: string }) {
  if (!isValidCollection(collection) || !isSafeSlug(slug)) throw new Error('Invalid collection or slug')
  const { token, owner, repo, branch } = getEnv()
  const filePath = `collections/${collection}/${slug}.mdx`
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
  const sha = await getFileSHA(apiUrl, token)
  if (!sha) throw new Error('File not found')
  const res = await fetch(apiUrl, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `delete(${collection}): ${slug}`, sha, branch }),
  })
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`)
  const result = await res.json()

  // local unlink is best-effort (fails routinely on a read-only prod filesystem)
  // and must not gate cache invalidation — GitHub's delete already succeeded,
  // so the cache needs to stop serving the deleted entry regardless
  try { await fs.promises.unlink(path.join(process.cwd(), filePath)) } catch {}
  try { invalidate(path.join(process.cwd(), filePath)) } catch {}
  try { evictCollection(collection as any) } catch {}

  return result
}

export async function commitFile({ path: filePath, content, message }: {
  path: string; content: string; message: string
}) {
  const { token, owner, repo, branch } = getEnv()
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
  // if the SHA lookup itself fails (vs. a confirmed 404), proceed without it —
  // GitHub's PUT will reject with a clear conflict if the file actually exists
  let sha: string | undefined
  try { sha = await getFileSHA(apiUrl, token) } catch {}
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  }
  if (sha) body.sha = sha
  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`)
  const result = await res.json()

  if (typeof content === 'string') {
    await writeLocalFile(filePath, content)
    try { invalidate(path.join(process.cwd(), filePath)) } catch {}
    // if committed to collections, evict that collection
    if (filePath.startsWith('collections/')) {
      const parts = filePath.split('/')
      if (parts.length >= 2) {
        try { evictCollection(parts[1] as any) } catch {}
      }
    }
  }

  return result
}
