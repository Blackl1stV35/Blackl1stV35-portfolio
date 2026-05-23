'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, FileText } from 'lucide-react'

const NAV = [
  { href: '/',             label: 'About'        },
  { href: '/work',         label: 'Work'         },
  { href: '/projects',     label: 'Projects'     },
  { href: '/publications', label: 'Publications' },
  { href: '/books',        label: 'Books'        },
  { href: '/contact',      label: 'Contact'      },
]

export default function Navbar() {
  const pathname = usePathname()
  const [dlOpen, setDlOpen] = useState(false)
  const [dlType, setDlType] = useState<'cv' | 'portfolio'>('cv')

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between" style={{ height: 52 }}>
          <Link href="/" className="font-serif font-bold text-base tracking-tight text-zinc-900 flex-shrink-0">
            K.S
          </Link>
          <div className="hidden md:flex items-center">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors
                  ${pathname === href ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}
              >{label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => { setDlType('cv'); setDlOpen(true) }}
              className="flex items-center gap-1 text-xs font-mono border border-zinc-200 px-2.5 py-1 rounded hover:bg-zinc-50 transition-colors"
            ><Download size={12} /> CV</button>
            <button onClick={() => { setDlType('portfolio'); setDlOpen(true) }}
              className="flex items-center gap-1 text-xs font-mono border border-zinc-200 px-2.5 py-1 rounded hover:bg-zinc-50 transition-colors"
            ><FileText size={12} /> Portfolio</button>
          </div>
        </div>
      </nav>

      {dlOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={e => e.target === e.currentTarget && setDlOpen(false)}
        >
          <div className="bg-white rounded-lg p-6 w-80 border border-zinc-200">
            <h2 className="font-serif font-bold text-base mb-2">
              {dlType === 'cv' ? 'Download CV / Resume' : 'Download Portfolio'}
            </h2>
            <p className="text-sm text-zinc-500 font-serif mb-5 leading-relaxed">
              {dlType === 'cv'
                ? 'Latest CV — static file, always reflects your most recent upload.'
                : 'Full portfolio document — cover page, bio, work, projects, and publications.'}
            </p>
            <div className="flex gap-2 mb-3">
              <a href={dlType === 'cv' ? '/cv.pdf' : '/api/export?format=pdf'} download
                className="flex-1 text-center text-sm font-mono bg-zinc-900 text-white py-2 rounded hover:bg-zinc-700 transition-colors"
                onClick={() => setDlOpen(false)}
              >PDF</a>
              <a href={dlType === 'cv' ? '/cv.pdf' : '/api/export?format=docx'} download
                className="flex-1 text-center text-sm font-mono border border-zinc-200 py-2 rounded hover:bg-zinc-50 transition-colors"
                onClick={() => setDlOpen(false)}
              >DOCX</a>
              <button onClick={() => setDlOpen(false)}
                className="px-4 text-sm font-mono border border-zinc-200 py-2 rounded hover:bg-zinc-50"
              >✕</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
