import Navbar from '@/components/Navbar'
import path from 'path'
import { readJSON } from '@/lib/cache'

async function getInitials(): Promise<string> {
  try {
    const a = await readJSON(path.join(process.cwd(), 'content', 'author.json')).catch(() => ({} as any))
    const name = String(a.name ?? '')
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase() || 'AB'
  } catch { return 'AB' }
}

async function getAuthorName(): Promise<string> {
  try {
    const a = await readJSON(path.join(process.cwd(), 'content', 'author.json')).catch(() => ({} as any))
    return String(a.name ?? 'KS')
  } catch { return 'KS' }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const initials = await getInitials()
  const authorName = await getAuthorName()

  return (
    <>
      <Navbar initials={initials} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">{children}</main>
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 py-8 mt-16 border-t border-zinc-100">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs font-mono text-zinc-400">
          <span>© 2026 {authorName}</span>
          <div className="flex flex-wrap items-center gap-4">
            <a href="/admin" className="hover:text-zinc-600 transition-colors">Admin</a>
            <span>Built with Next.js · Deployed on Vercel</span>
          </div>
        </div>
      </footer>
    </>
  )
}
