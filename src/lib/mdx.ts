/**
 * Serialises a flat object + markdown body into a .mdx string with YAML frontmatter.
 * Used by the admin API routes before committing to GitHub.
 */
export function buildMDX(fields: Record<string, unknown>, body: string): string {
  const lines: string[] = ['---']

  for (const [key, val] of Object.entries(fields)) {
    if (val === undefined || val === null || val === '') continue

    if (Array.isArray(val)) {
      lines.push(`${key}:`)
      val.forEach((v) => lines.push(`  - "${String(v).replace(/"/g, '\\"')}"`))
    } else if (typeof val === 'number') {
      lines.push(`${key}: ${val}`)
    } else {
      const str = String(val).replace(/"/g, '\\"')
      lines.push(`${key}: "${str}"`)
    }
  }

  lines.push('---')
  lines.push('')
  lines.push(body.trim())

  return lines.join('\n')
}

/**
 * Generates a URL-safe slug from a title string.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
