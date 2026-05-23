import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Script from 'next/script'
import fs from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Personal portfolio.',
}

function getInitials(): string {
  try {
    const a = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'author.json'), 'utf-8'))
    const name = String(a.name ?? '')
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase() || 'AB'
  } catch { return 'AB' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const initials = getInitials()

  return (
    <html lang="en">
      <body className="bg-zinc-50 text-zinc-900 antialiased">
        <Navbar initials={initials} />
        <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
        <footer className="max-w-4xl mx-auto px-6 py-8 mt-16 border-t border-zinc-100">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>© {new Date().getFullYear()} {initials}</span>
            <div className="flex items-center gap-4">
              <a href="/admin" className="hover:text-zinc-600 transition-colors">Admin</a>
              <span>Built with Next.js · Deployed on Vercel</span>
            </div>
          </div>
        </footer>

        {/* Google Translate — fixed bottom-right, no blocking elements nearby */}
        <div id="google_translate_element" style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
        }} />
        <Script id="gt-init" strategy="afterInteractive">{`
          function googleTranslateElementInit() {
            try {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                autoDisplay: false,
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
              }, 'google_translate_element');
            } catch(e) { console.warn('GT init failed', e); }
          }
        `}</Script>
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
