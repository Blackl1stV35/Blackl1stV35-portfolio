import { getCollection } from '@/lib/collections'
import type { BookEntry } from '@/types'
import BookCard from '@/components/BookCard'

export const revalidate = 0

export default async function BooksPage() {
  const entries = await getCollection<BookEntry>('books')
  return (
    <div>
      <div className="section-label">Reading List</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {entries.map((entry) => (
          <BookCard key={entry.slug} entry={entry} />
        ))}
      </div>
    </div>
  )
}
