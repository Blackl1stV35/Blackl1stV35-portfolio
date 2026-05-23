import { getCollection } from '@/lib/collections'
import type { WorkEntry } from '@/types'
import StatusBadge from '@/components/StatusBadge'

export default function WorkPage() {
  const entries = getCollection<WorkEntry>('work')
  return (
    <div>
      <div className="section-label">Experience</div>
      <div className="relative pl-5">
        <div className="absolute left-0 top-2 bottom-2 w-px bg-zinc-200" />
        {entries.map((e) => (
          <div key={e.slug} className="relative mb-8 pl-6">
            <div className="absolute -left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-white" />
            <div className="text-xs font-mono text-zinc-400 mb-0.5">{e.org}</div>
            <h2 className="text-base font-bold font-serif">{e.role}</h2>
            <div className="flex items-center gap-2 mt-1 mb-2">
              <span className="text-xs font-mono text-zinc-400">{e.start} — {e.end ?? 'Present'}</span>
              <StatusBadge status={e.status} variant="work" />
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">{e.description}</p>
            {e.stack && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {e.stack.map((t: string) => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
