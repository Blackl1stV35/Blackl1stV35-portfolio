export default function ContactPage() {
  return (
    <div>
      <div className="section-label">Contact</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {[
          { label: 'Email',    val: 'you@example.com',         href: 'kanokphan.s@ku.th' },
          { label: 'GitHub',   val: 'github.com/yourusername', href: 'https://github.com/Blackl1stV35' },
          { label: 'LinkedIn', val: 'linkedin.com/in/you',     href: 'https://www.linkedin.com/in/kanokphan-sirithienthong-034787230' },
          { label: 'Location', val: 'Bangkok, Thailand',       href: null },
        ].map(({ label, val, href }) => (
          <div key={label} className="border border-zinc-100 rounded-md p-4 bg-white">
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">{label}</div>
            {href
              ? <a href={href} className="text-sm font-serif text-zinc-900 hover:text-zinc-500 transition-colors">{val}</a>
              : <div className="text-sm font-serif">{val}</div>}
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-100 pt-6">
        <div className="text-xs font-mono text-zinc-400 mb-4">Send a message — powered by Formspree (free)</div>
        <form action="https://formspree.io/f/xpqnlqpn" method="POST" className="space-y-4 max-w-lg">
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
