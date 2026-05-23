// Commits or updates an MDX file in the GitHub repo via the GitHub Contents API

interface GitHubWriteOptions {
  collection: string
  slug: string
  content: string // full MDX string including frontmatter
}

export async function commitMDX({ collection, slug, content }: GitHubWriteOptions) {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo  = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    throw new Error('Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO env vars')
  }

  const path = `collections/${collection}/${slug}.mdx`
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  // Get current SHA if file exists (required for updates)
  let sha: string | undefined
  try {
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })
    if (res.ok) {
      const json = await res.json()
      sha = json.sha
    }
  } catch {}

  const body: Record<string, unknown> = {
    message: sha ? `update(${collection}): ${slug}` : `add(${collection}): ${slug}`,
    content: Buffer.from(content).toString('base64'),
    branch: 'main',
  }
  if (sha) body.sha = sha

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub API error ${res.status}: ${err}`)
  }

  return res.json()
}

export async function deleteMDX({ collection, slug }: Omit<GitHubWriteOptions, 'content'>) {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo  = process.env.GITHUB_REPO

  if (!token || !owner || !repo) throw new Error('Missing GitHub env vars')

  const path = `collections/${collection}/${slug}.mdx`
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

  const shaRes = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  if (!shaRes.ok) throw new Error('File not found')
  const { sha } = await shaRes.json()

  const res = await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: `delete(${collection}): ${slug}`, sha, branch: 'main' }),
  })

  if (!res.ok) throw new Error(`GitHub API error ${res.status}`)
  return res.json()
}
