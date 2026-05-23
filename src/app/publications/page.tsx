import { getCollection } from '@/lib/collections'
import type { PublicationEntry } from '@/types'
import StatusBadge from '@/components/StatusBadge'

export default function PublicationsPage() {
  const entries = getCollection<PublicationEntry>('publications')
  return (
    <div>
      <div className="section-label">Publications</div>
      <div className="flex flex-col border border-zinc-100 rounded-md overflow-hidden">
        {entries.map((e) => (
          <div key={e.slug} className="bg-white p-5 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-1.5">
              <h2 className="text-sm font-bold font-serif">{e.title}</h2>
              <StatusBadge status={e.status} variant="publication" />
            </div>
            <div className="text-xs font-mono text-zinc-400 mb-2">
              {e.type}
              {e.venue && <> · {e.venue}</>}
              {e.year && <> · {e.year}</>}
              {e.doi && <> · <a href={`https://doi.org/${e.doi}`} target="_blank" rel="noopener" className="hover:text-zinc-700">DOI ↗</a></>}
              {e.arxiv && <> · <a href={`https://arxiv.org/abs/${e.arxiv}`} target="_blank" rel="noopener" className="hover:text-zinc-700">arXiv ↗</a></>}
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">{e.description}</p>
            {e.tags && (
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
