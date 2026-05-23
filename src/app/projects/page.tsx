import { getCollection } from '@/lib/collections'
import type { ProjectEntry } from '@/types'
import StatusBadge from '@/components/StatusBadge'

export const revalidate = 0




export default async function ProjectsPage() {
  const entries = await getCollection<ProjectEntry>('projects')
  return (
    <div>
      <div className="section-label">Projects</div>
      <div className="flex flex-col border border-zinc-100 rounded-md overflow-hidden">
        {entries.map((e) => (
          <div key={e.slug} className="bg-white p-5 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-1.5">
              <h2 className="text-sm font-bold font-serif">{e.title}</h2>
              <StatusBadge status={e.status} />
            </div>
            <div className="text-xs font-mono text-zinc-400 mb-2">
              {e.type}
              {e.repo && <> · <a href={e.repo} target="_blank" rel="noopener" className="hover:text-zinc-700 transition-colors">repo ↗</a></>}
              {e.stars != null && <> · ★ {e.stars}</>}
              {e.forks != null && <> · 🍴 {e.forks}</>}
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">{e.description}</p>
            {Array.isArray(e.tags) && e.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {e.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
