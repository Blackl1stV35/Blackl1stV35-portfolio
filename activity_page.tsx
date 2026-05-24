import { getCollection } from '@/lib/collections'
import type { ActivityEntry } from '@/types'
import StatusBadge from '@/components/StatusBadge'

export const revalidate = 0

const TYPE_LABEL: Record<string, string> = {
  talk: 'Talk', workshop: 'Workshop', competition: 'Competition',
  volunteer: 'Volunteer', conference: 'Conference', hackathon: 'Hackathon', event: 'Event',
}
const ROLE_LABEL: Record<string, string> = {
  speaker: 'Speaker', participant: 'Participant', organiser: 'Organiser',
  mentor: 'Mentor', judge: 'Judge', volunteer: 'Volunteer',
}
const STATUS_LABEL: Record<string, string> = {
  green: 'Attended', yellow: 'Upcoming', red: 'Cancelled',
}

export default async function ActivityPage() {
  const entries = await getCollection<ActivityEntry>('activity')

  return (
    <div>
      <div className="section-label">Activity</div>
      {entries.length === 0 && (
        <p className="text-sm text-zinc-400 font-mono">No activities yet. Add entries via the admin panel.</p>
      )}
      <div className="flex flex-col border border-zinc-100 rounded-md overflow-hidden">
        {entries.map((e) => (
          <div key={e.slug} className="bg-white p-5 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-1.5">
              <h2 className="text-sm font-bold font-serif">{e.title}</h2>
              <StatusBadge status={e.status} customLabel={STATUS_LABEL[e.status]} />
            </div>
            <div className="text-xs font-mono text-zinc-400 mb-2 flex flex-wrap gap-x-3 gap-y-0.5">
              {e.type      && <span>{TYPE_LABEL[e.type] ?? e.type}</span>}
              {e.role      && <span>· {ROLE_LABEL[e.role] ?? e.role}</span>}
              {e.organiser && <span>· {e.organiser}</span>}
              {e.location  && <span>· {e.location}</span>}
              {e.date      && <span>· {e.date}</span>}
              {e.url       && <span>· <a href={e.url} target="_blank" rel="noopener" className="hover:text-zinc-700 transition-colors">Link ↗</a></span>}
            </div>
            {e.description && <p className="text-sm text-zinc-600 leading-relaxed">{e.description}</p>}
            {e.tags && e.tags.length > 0 && (
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
