'use client'

import { useState } from 'react'
import type { BookEntry } from '@/types'
import StatusBadge from './StatusBadge'

interface Props {
  entry: BookEntry
}

const DESCRIPTION_LIMIT = 260

export default function BookCard({ entry }: Props) {
  const [expanded, setExpanded] = useState(false)
  const description = entry.description ?? ''
  const isLong = description.length > DESCRIPTION_LIMIT

  return (
    <div className="border border-zinc-100 rounded-md overflow-hidden hover:border-zinc-300 transition-colors bg-white">
      <div className="h-24 bg-zinc-50 flex items-center justify-center text-3xl border-b border-zinc-100">
        📚
      </div>
      <div className="p-3">
        <div className="text-xs font-bold font-serif leading-tight mb-0.5">{entry.title}</div>
        <div className="text-xs font-mono text-zinc-400 mb-2">{entry.author}</div>
        <StatusBadge status={entry.status} variant="book" />

        {description ? (
          <div className="mt-3">
            <p
              className="text-sm text-zinc-600 leading-relaxed"
              style={expanded ? undefined : {
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {description}
            </p>
            {isLong && (
              <button
                type="button"
                className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-zinc-600 hover:text-zinc-900"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        ) : null}

        {entry.notes && <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{entry.notes}</p>}
      </div>
    </div>
  )
}
