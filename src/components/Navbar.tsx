'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, FileText, Type } from 'lucide-react'

const NAV = [
  { href: '/',             label: 'About'        },
  { href: '/work',         label: 'Work'         },
  { href: '/projects',     label: 'Projects'     },
  { href: '/publications', label: 'Publications' },
  { href: '/books',        label: 'Books'        },
  { href: '/contact',      label: 'Contact'      },
]

const FONT_SIZES = [13, 15, 16, 18, 20]
const FONT_DEFAULT = 16

export default function Navbar() {
  const pathname           = usePathname()
  const [dlOpen, setDlOpen]     = useState(false)
  const [dlType, setDlType]     = useState<'cv' | 'portfolio'>('cv')
  const [fontSize, setFontSize] = useState(FONT_DEFAULT)
  const [fontOpen, setFontOpen] = useState(false)
  const fontRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('portfolio_font_size')
    if (saved) applyFont(Number(saved))
  }, [])

  // Close font menu on outside click — no backdrop div needed
  useEffect(() => {
    if (!fontOpen) return
    function handler(e: MouseEvent) {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) {
        setFontOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [fontOpen])

  function applyFont(size: number) {
    setFontSize(size)
    // Set directly on body element — no CSS var conflict with Tailwind base
    document.body.style.fontSize = `${size}px`
    localStorage.setItem('portfolio_font_size', String(size))
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between" style={{ height: 52 }}>

          <Link href="/" className="font-serif font-bold text-base tracking-tight text-zinc-900 flex-shrink-0">
            A.B.
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

            {/* Google Translate — widget rendered here, dropdown is a fixed frame from Google */}
            <div id="google_translate_element" />

            {/* Font size adjuster — outside-click handled by mousedown listener, no backdrop */}
            <div ref={fontRef} className="relative">
              <button
                onClick={() => setFontOpen(o => !o)}
                title="Adjust font size"
                className="flex items-center gap-1 text-xs font-mono border border-zinc-200 px-2.5 py-1 rounded hover:bg-zinc-50 transition-colors"
              >
                <Type size={12} />{fontSize}px
              </button>
              {fontOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-md overflow-hidden z-50 shadow-sm min-w-[140px]">
                  <div className="px-3 py-1.5 text-xs font-mono text-zinc-400 border-b border-zinc-100">Font size</div>
                  {FONT_SIZES.map(s => (
                    <button key={s}
                      onClick={() => { applyFont(s); setFontOpen(false) }}
                      className={`w-full text-left px-4 py-1.5 text-xs font-mono hover:bg-zinc-50 transition-colors
                        ${fontSize === s ? 'text-zinc-900 font-bold bg-zinc-50' : 'text-zinc-500'}`}
                    >
                      {s}px{s === FONT_DEFAULT ? ' (default)' : s < FONT_DEFAULT ? ' − small' : ' + large'}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
              {dlType === 'cv' ? 'Download CV / Resume' : 'Download Portfolio PDF'}
            </h2>
            <p className="text-sm text-zinc-500 font-serif mb-5 leading-relaxed">
              {dlType === 'cv'
                ? 'Latest CV — static file, always reflects your most recent upload.'
                : 'Full portfolio PDF with cover page, bio, work, projects, and publications.'}
            </p>
            <div className="flex gap-2">
              <a href={dlType === 'cv' ? '/cv.pdf' : '/api/pdf'} download
                className="flex-1 text-center text-sm font-mono bg-zinc-900 text-white py-2 rounded hover:bg-zinc-700 transition-colors"
                onClick={() => setDlOpen(false)}
              >Download</a>
              <button onClick={() => setDlOpen(false)}
                className="flex-1 text-sm font-mono border border-zinc-200 py-2 rounded hover:bg-zinc-50"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
