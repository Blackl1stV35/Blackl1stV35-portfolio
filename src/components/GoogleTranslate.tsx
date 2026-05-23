"use client"
import { useEffect } from 'react'

export async function loadGoogleTranslate(): Promise<void> {
  if (typeof window === 'undefined') return
  const w = window as any
  if (w.__googleTranslateInstalled) return
  w.__googleTranslateInstalled = true

  return new Promise((resolve) => {
    w.googleTranslateElementInit = function () {
      try {
        // @ts-ignore
        new w.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,th,zh-CN',
          layout: w.google.translate.TranslateElement.InlineLayout.SIMPLE,
        }, 'google_translate_element')
      } catch (e) { console.warn('GT init failed', e) }

      w._gt_show = () => {
        const el = document.getElementById('google_translate_element')
        const btn = el?.querySelector('.goog-te-gadget-simple') as HTMLElement | null
        if (btn) {
          btn.click()
          return
        }
        const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
        if (combo) {
          combo.focus()
        }
      }

      w._gt_click = () => {
        const el = document.getElementById('google_translate_element')
        const btn = el?.querySelector('.goog-te-gadget-simple') as HTMLElement | null
        if (btn) btn.click()
      }

      w._gt_select = (lang: string) => {
        const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
        if (!combo) return
        const code = lang === 'zh' ? 'zh-CN' : lang
        combo.value = code
        combo.dispatchEvent(new Event('change'))
      }
      resolve()
    }

    const s = document.createElement('script')
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    s.async = true
    s.onload = () => { }
    document.head.appendChild(s)
  })
}

export default function GoogleTranslate() {
  return (
    <div id="google_translate_element" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: 1,
      height: 1,
      opacity: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: -1,
    }} />
  )
}
