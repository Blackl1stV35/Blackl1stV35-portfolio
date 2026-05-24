'use client'
import { useState, useEffect } from 'react'
import GoogleTranslate, { loadGoogleTranslate } from './GoogleTranslate'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, FileText } from 'lucide-react'

const NAV = [
  { href: '/',             label: 'About'        },
  { href: '/work',         label: 'Work'         },
  { href: '/projects',     label: 'Projects'     },
  { href: '/publications', label: 'Publications' },
  { href: '/activity',     label: 'Activity'     },
  { href: '/achievement',  label: 'Achievement'  },
  { href: '/books',        label: 'Books'        },
  { href: '/contact',      label: 'Contact'      },
]

interface Props { initials: string }

export default function Navbar({ initials }: Props) {
  const pathname = usePathname()
  const [dlOpen, setDlOpen] = useState(false)
  const [dlType, setDlType] = useState<'cv' | 'portfolio'>('cv')
  const [lang, setLang]     = useState<'en' | 'th' | 'zh'>('en')
  const [theme, setTheme]   = useState<'bright' | 'dark'>('bright')

  useEffect(() => {
    const l = (localStorage.getItem('site_lang') as 'en' | 'th' | 'zh') || 'en'
    setLang(l)
    const t = (localStorage.getItem('site_theme') as 'bright' | 'dark') || 'bright'
    setTheme(t)
    if (t === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  async function openGoogleTranslate() {
    try {
      await loadGoogleTranslate()
      const w = window as any
      if (typeof w._gt_show === 'function') w._gt_show()
      else if (typeof w._gt_click === 'function') w._gt_click()
    } catch (e) { console.warn('Google Translate load failed', e) }
  }

  function toggleTheme() {
    const next = theme === 'bright' ? 'dark' : 'bright'
    setTheme(next)
    localStorage.setItem('site_theme', next)
    if (next === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  const translations: Record<string, Record<string, string>> = {
    en: { About: 'About', Work: 'Work', Projects: 'Projects', Publications: 'Publications', Activity: 'Activity', Achievement: 'Achievement', Books: 'Books', Contact: 'Contact' },
    th: { About: 'เกี่ยวกับ', Work: 'งาน', Projects: 'โครงการ', Publications: 'ผลงาน', Activity: 'กิจกรรม', Achievement: 'ความสำเร็จ', Books: 'หนังสือ', Contact: 'ติดต่อ' },
    zh: { About: '关于', Work: '工作', Projects: '项目', Publications: '出版物', Activity: '活动', Achievement: '成就', Books: '书籍', Contact: '联系' },
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between" style={{ height: 52 }}>
          <Link href="/" className="font-serif font-bold text-base tracking-tight text-zinc-900 flex-shrink-0">
            {initials}
          </Link>
          <div className="hidden md:flex items-center overflow-x-auto">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`px-2.5 py-1.5 text-xs font-mono uppercase tracking-widest transition-colors whitespace-nowrap
                  ${pathname === href ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}
              >{translations[lang][label] ?? label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => { setDlType('cv'); setDlOpen(true) }}
              className="flex items-center gap-1 text-xs font-mono border border-zinc-200 px-2.5 py-1 rounded hover:bg-zinc-50 transition-colors"
            ><Download size={12} /> CV</button>
            <button onClick={() => { setDlType('portfolio'); setDlOpen(true) }}
              className="flex items-center gap-1 text-xs font-mono border border-zinc-200 px-2.5 py-1 rounded hover:bg-zinc-50 transition-colors"
            ><FileText size={12} /> Portfolio</button>
            <GoogleTranslate />
            <button onClick={openGoogleTranslate} onMouseEnter={() => { loadGoogleTranslate().catch(() => {}) }}
              title="Translate page"
              className="text-xs font-mono border border-zinc-200 px-2 py-1 rounded hover:bg-zinc-50 transition-colors"
            >Translate</button>
            <button onClick={toggleTheme} title="Toggle Bright / Dark"
              className="text-xs font-mono border border-zinc-200 px-2 py-1 rounded hover:bg-zinc-50 transition-colors"
            >{theme === 'bright' ? '🌞' : '🌙'}</button>
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
            <p className="text-sm text-zinc-500 font-serif mb-4 leading-relaxed">
              {dlType === 'cv'
                ? 'Latest CV — static file, reflects your most recent upload.'
                : 'Full portfolio document including activity and achievements.'}
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
