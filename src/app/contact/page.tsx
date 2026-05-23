import fs from 'fs'
import path from 'path'

export const revalidate = 0

interface Author {
  name?: string; email?: string; github?: string; linkedin?: string; location?: string
}

function getAuthor(): Author {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'author.json'), 'utf-8'))
  } catch { return {} }
}

export default function ContactPage() {
  const a = getAuthor()

  const contacts = [
    a.email    && { label: 'Email',    val: a.email,    href: `mailto:${a.email}` },
    a.github   && { label: 'GitHub',   val: a.github,   href: a.github.startsWith('http') ? a.github : `https://${a.github}` },
    a.linkedin && { label: 'LinkedIn', val: a.linkedin, href: a.linkedin.startsWith('http') ? a.linkedin : `https://${a.linkedin}` },
    a.location && { label: 'Location', val: a.location, href: null },
  ].filter(Boolean) as { label: string; val: string; href: string | null }[]

  return (
    <div>
      <div className="section-label">Contact</div>
      {contacts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {contacts.map(({ label, val, href }) => (
            <div key={label} className="border border-zinc-100 rounded-md p-4 bg-white">
              <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">{label}</div>
              {href
                ? <a href={href} className="text-sm font-serif text-zinc-900 hover:text-zinc-500 transition-colors">{val}</a>
                : <div className="text-sm font-serif">{val}</div>}
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-zinc-100 pt-6">
        <div className="text-xs font-mono text-zinc-400 mb-4">Send a message</div>
        <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST" className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1">Name</label>
            <input name="name" type="text" required className="w-full border border-zinc-200 rounded px-3 py-2 text-sm font-serif focus:outline-none focus:border-zinc-400" />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1">Email</label>
            <input name="email" type="email" required className="w-full border border-zinc-200 rounded px-3 py-2 text-sm font-serif focus:outline-none focus:border-zinc-400" />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1">Message</label>
            <textarea name="message" rows={4} required className="w-full border border-zinc-200 rounded px-3 py-2 text-sm font-serif resize-none focus:outline-none focus:border-zinc-400" />
          </div>
          <button type="submit" className="bg-zinc-900 text-white text-sm font-serif px-5 py-2 rounded hover:bg-zinc-700 transition-colors">
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}
