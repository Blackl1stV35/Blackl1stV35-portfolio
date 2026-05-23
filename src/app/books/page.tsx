import { getCollection } from '@/lib/collections'
import type { BookEntry } from '@/types'
import StatusBadge from '@/components/StatusBadge'

export const revalidate = 0




export default async function BooksPage() {
  const entries = await getCollection<BookEntry>('books')
  return (
    <div>
      <div className="section-label">Reading List</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {entries.map((e) => (
          <div key={e.slug} className="border border-zinc-100 rounded-md overflow-hidden hover:border-zinc-300 transition-colors bg-white">
            <div className="h-24 bg-zinc-50 flex items-center justify-center text-3xl border-b border-zinc-100">
              📚
            </div>
            <div className="p-3">
              <div className="text-xs font-bold font-serif leading-tight mb-0.5">{e.title}</div>
              <div className="text-xs font-mono text-zinc-400 mb-2">{e.author}</div>
              <StatusBadge status={e.status} variant="book" />
              {e.notes && <p className="text-xs text-zinc-500 mt-2 leading-relaxed line-clamp-2">{e.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
