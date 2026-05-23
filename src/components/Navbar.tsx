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

  function openDl(type: 'cv' | 'portfolio') {
    setDlType(type)
    setDlOpen(true)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-13 flex items-center justify-between" style={{ height: 52 }}>

          <Link href="/" className="font-serif font-bold text-base tracking-tight text-zinc-900">
            A.B.
          </Link>

          <div className="hidden md:flex items-center">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors
                  ${pathname === href ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Google Translate widget mount point */}
            <div id="google_translate_element" className="text-xs" />

            <button
              onClick={() => openDl('cv')}
              className="flex items-center gap-1 text-xs font-mono border border-zinc-200 px-2.5 py-1 rounded hover:bg-zinc-50 transition-colors"
            >
              <Download size={12} /> CV
            </button>
            <button
              onClick={() => openDl('portfolio')}
              className="flex items-center gap-1 text-xs font-mono border border-zinc-200 px-2.5 py-1 rounded hover:bg-zinc-50 transition-colors"
            >
              <FileText size={12} /> Portfolio
            </button>
          </div>
        </div>
      </nav>

      {/* Download modal */}
      {dlOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setDlOpen(false)}
        >
          <div className="bg-white rounded-lg p-6 w-80 border border-zinc-200">
            <h2 className="font-serif font-bold text-base mb-2">
              {dlType === 'cv' ? 'Download CV / Resume' : 'Download Portfolio PDF'}
            </h2>
            <p className="text-sm text-zinc-500 font-serif mb-5 leading-relaxed">
              {dlType === 'cv'
                ? 'Latest CV served as a static file. Always reflects your most recent upload.'
                : 'Full portfolio PDF — all collections in formal layout including projects, work, publications, and books.'}
            </p>
            <div className="flex gap-2">
              <a
                href={dlType === 'cv' ? '/cv.pdf' : '/portfolio.pdf'}
                download
                className="flex-1 text-center text-sm font-mono bg-zinc-900 text-white py-2 rounded hover:bg-zinc-700 transition-colors"
                onClick={() => setDlOpen(false)}
              >
                Download
              </a>
              <button
                onClick={() => setDlOpen(false)}
                className="flex-1 text-sm font-mono border border-zinc-200 py-2 rounded hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
