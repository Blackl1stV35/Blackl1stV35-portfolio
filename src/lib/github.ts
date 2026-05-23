// GitHub Contents API — server-side only
import fs from 'fs'
import path from 'path'
import { invalidate } from './cache'
import { evictCollection } from './collections'

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

async function getFileSHA(apiUrl: string, token: string): Promise<string | undefined> {
  try {
    const r = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })
    if (r.ok) return (await r.json()).sha
  } catch {}
  return undefined
}

export async function commitMDX({ collection, slug, content }: {
  collection: string; slug: string; content: string
}) {
  return commitFile({
    path: `collections/${collection}/${slug}.mdx`,
    content,
    message: `update(${collection}): ${slug}`,
  })
}

export async function deleteMDX({ collection, slug }: { collection: string; slug: string }) {
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

  try {
    await fs.promises.unlink(path.join(process.cwd(), filePath))
    // invalidate cache for this collection file
    try { invalidate(path.join(process.cwd(), filePath)) } catch {}
    try { evictCollection(collection as any) } catch {}
  } catch {
    // ignore missing or read-only filesystem errors
  }

  return result
}

export async function commitFile({ path: filePath, content, message }: {
  path: string; content: string; message: string
}) {
  const { token, owner, repo, branch } = getEnv()
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
  const sha = await getFileSHA(apiUrl, token)
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
