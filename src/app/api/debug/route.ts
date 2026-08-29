import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { authorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = req.nextUrl.searchParams.get('file') || ''
  if (!q) return NextResponse.json({ error: 'Missing file param' }, { status: 400 })

  // restrict to content and collections — checked against the *resolved* path so
  // a traversal segment (e.g. "collections/../../etc/passwd") can't escape the
  // string-prefix check and read arbitrary files off the server
  if (!q.startsWith('content/') && !q.startsWith('collections/')) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
  }
  const root = path.resolve(process.cwd())
  const localPath = path.resolve(root, q)
  if (localPath !== root && !localPath.startsWith(root + path.sep)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
  }

  let local: string | null = null
  try { local = await fs.readFile(localPath, 'utf-8') } catch {}

  // attempt GitHub fetch if env present
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const branch = process.env.GITHUB_BRANCH ?? 'master'
  let remote: string | null = null
  if (token && owner && repo) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${q}?ref=${branch}`
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } })
      if (r.ok) {
        const j = await r.json()
        if (j?.content) remote = Buffer.from(j.content, 'base64').toString('utf8')
      }
    } catch {}
  }

  return NextResponse.json({ file: q, source: remote ? 'github' : 'local', hasLocal: !!local, hasRemote: !!remote })
}
