import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import path from 'path'
import { readJSON } from '@/lib/cache'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Personal portfolio.',
}

export const dynamic = 'force-dynamic'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initials = await getInitials()
  const authorName = await getAuthorName()

  return (
    <html lang="en">
      <body className="bg-zinc-50 text-zinc-900 antialiased">
        <Navbar initials={initials} />
        <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
        <footer className="max-w-4xl mx-auto px-6 py-8 mt-16 border-t border-zinc-100">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>© 2026 {authorName}</span>
            <div className="flex items-center gap-4">
              <a href="/admin" className="hover:text-zinc-600 transition-colors">Admin</a>
              <span>Built with Next.js · Deployed on Vercel</span>
            </div>
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
