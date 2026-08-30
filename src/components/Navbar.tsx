'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, FileText, Menu, X } from 'lucide-react'

const NAV = [
  { href: '/',             label: 'About'        },
  { href: '/work',         label: 'Work'         },
  { href: '/projects',     label: 'Projects'     },
  { href: '/publications', label: 'Publications' },
  { href: '/books',        label: 'Books'        },
  { href: '/activity',     label: 'Activity'     },
  { href: '/achievement',  label: 'Achievement'  },
  { href: '/contact',      label: 'Contact'      },
]

interface Props { initials: string }

export default function Navbar({ initials }: Props) {
  const pathname = usePathname()
  const [dlOpen, setDlOpen] = useState(false)
  const [dlType, setDlType] = useState<'cv' | 'portfolio'>('cv')
  const [theme, setTheme] = useState<'bright'|'dark'>('bright')
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const t = (localStorage.getItem('site_theme') as 'bright'|'dark') || 'bright'
    setTheme(t)
    if (t === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  // close the mobile nav on route change
  useEffect(() => { setNavOpen(false) }, [pathname])

  function toggleTheme() {
    const next = theme === 'bright' ? 'dark' : 'bright'
    setTheme(next)
    localStorage.setItem('site_theme', next)
    if (next === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 52 }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setNavOpen((o) => !o)}
              className="lg:hidden text-zinc-500 hover:text-zinc-900 transition-colors -ml-1 p-1"
              aria-label="Toggle navigation menu" aria-expanded={navOpen}
            >{navOpen ? <X size={20} /> : <Menu size={20} />}</button>
            <Link href="/" className="font-serif font-bold text-base tracking-tight text-zinc-900 flex-shrink-0">
              {initials}
            </Link>
          </div>
          <div className="hidden lg:flex items-center">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors
                  ${pathname === href ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}
              >{label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button onClick={() => { setDlType('cv'); setDlOpen(true) }}
              className="flex items-center gap-1 text-xs font-mono border border-zinc-200 px-2 sm:px-2.5 py-1 rounded hover:bg-zinc-50 transition-colors"
            ><Download size={12} /> <span className="hidden sm:inline">CV</span></button>
            <button onClick={() => { setDlType('portfolio'); setDlOpen(true) }}
              className="flex items-center gap-1 text-xs font-mono border border-zinc-200 px-2 sm:px-2.5 py-1 rounded hover:bg-zinc-50 transition-colors"
            ><FileText size={12} /> <span className="hidden sm:inline">Portfolio</span></button>
            <button onClick={toggleTheme}
              title="Toggle Bright / Dark"
              className="text-xs font-mono border border-zinc-200 px-2 py-1 rounded hover:bg-zinc-50 transition-colors"
            >{theme === 'bright' ? '🌞' : '🌙'}</button>
          </div>
        </div>

        {/* mobile nav drawer — the desktop links above are hidden below md, so
            this is the only way to reach any page other than About on mobile */}
        {navOpen && (
          <div className="lg:hidden border-t border-zinc-100 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-1 flex flex-col">
              {NAV.map(({ href, label }) => (
                <Link key={href} href={href}
                  className={`py-3 text-sm font-mono uppercase tracking-widest border-b border-zinc-50 last:border-b-0 transition-colors
                    ${pathname === href ? 'text-zinc-900' : 'text-zinc-400'}`}
                >{label}</Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {dlOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          onClick={e => e.target === e.currentTarget && setDlOpen(false)}
        >
          <div className="bg-white rounded-lg p-6 w-80 max-w-full border border-zinc-200">
            <h2 className="font-serif font-bold text-base mb-2">
              {dlType === 'cv' ? 'Download CV / Resume' : 'Download Portfolio'}
            </h2>
            <p className="text-sm text-zinc-500 font-serif mb-4 leading-relaxed">
              {dlType === 'cv'
                ? 'Latest CV — static file, reflects your most recent upload.'
                : 'Full portfolio — cover, bio, work, projects, publications, contact.'}
            </p>
            {dlType === 'portfolio' ? (
              <div className="flex gap-2 mb-2">
                <a href="/api/export?format=docx" download
                  className="flex-1 text-center text-sm font-mono bg-zinc-900 text-white py-2 rounded hover:bg-zinc-700 transition-colors"
                  onClick={() => setDlOpen(false)}
                >DOCX</a>
                <button onClick={() => setDlOpen(false)}
                  className="px-3 text-sm font-mono border border-zinc-200 py-2 rounded hover:bg-zinc-50"
                >✕</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <a href="/cv.pdf" download
                  className="flex-1 text-center text-sm font-mono bg-zinc-900 text-white py-2 rounded hover:bg-zinc-700 transition-colors"
                  onClick={() => setDlOpen(false)}
                >Download</a>
                <button onClick={() => setDlOpen(false)}
                  className="flex-1 text-sm font-mono border border-zinc-200 py-2 rounded hover:bg-zinc-50"
                >Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
