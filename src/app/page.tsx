import path from 'path'
import { readJSON } from '@/lib/cache'
import StatusBadge from '@/components/StatusBadge'
import type { StatusColor } from '@/types'

export const revalidate = 0




interface Author {
  name: string; title: string; status: StatusColor; statusLabel: string
  bio: string; bio2?: string; tags: string[]
  degree1?: string; degree2?: string; github?: string; email?: string
  photo?: string | null
}

export default async function AboutPage() {
  const file = path.join(process.cwd(), 'content', 'author.json')
  const a = await readJSON<Author>(file).catch(() => ({} as Author))
  return (
    <div>
      <div className="section-label">Author</div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-8 items-start">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-1">{a.name}</h1>
          <p className="text-sm text-zinc-500 mb-3">{a.title}</p>
          <StatusBadge status={a.status} className="mb-4" />
          <p className="text-sm leading-relaxed text-zinc-600 mb-3">{a.bio}</p>
          {a.bio2 && <p className="text-sm leading-relaxed text-zinc-600">{a.bio2}</p>}
          {Array.isArray(a.tags) && a.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {a.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-3">
          {/* Photo — set from admin, read-only on public page */}
          {a.photo ? (
            <img src={a.photo} alt={a.name} className="w-40 h-40 object-cover rounded border border-zinc-200" />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center rounded border border-dashed border-zinc-200 bg-zinc-50 text-4xl font-serif text-zinc-300">
              {a.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
          )}
          <div className="text-xs font-mono text-zinc-400 leading-7">
            {a.degree1 && <div>{a.degree1}</div>}
            {a.degree2 && <div>{a.degree2}</div>}
            {a.github  && <div className="mt-1">{a.github}</div>}
            {a.email   && <div>{a.email}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
