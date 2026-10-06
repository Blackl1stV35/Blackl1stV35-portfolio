'use client'
import { useState } from 'react'
import { Play } from 'lucide-react'
import ImageLightbox from './ImageLightbox'
import { isVideo } from '@/lib/media'

interface Props {
  pictures?: string[]
  label: string
}

export default function PictureStrip({ pictures, label }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  if (!pictures || pictures.length === 0) return null
  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3">
        {pictures.map((src, i) => isVideo(src) ? (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            title="Click to play"
            aria-label={`${label} video ${i + 1}`}
            className="relative h-28 w-28 rounded overflow-hidden border border-zinc-100 cursor-pointer hover:opacity-80 transition-opacity"
          >
            {/* #t=0.5 makes the browser paint a frame as the tile's poster */}
            <video
              src={`${src}#t=0.5`}
              preload="metadata"
              muted
              playsInline
              className="h-full w-full object-cover pointer-events-none"
            />
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="rounded-full bg-black/60 p-2 text-white"><Play size={14} fill="currentColor" /></span>
            </span>
          </button>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary
          // uploaded file under public/uploads, not a build-known asset
          <img
            key={i}
            src={src}
            alt={`${label} photo ${i + 1}`}
            onClick={() => setOpenIndex(i)}
            title="Click to inspect"
            className="h-28 w-28 rounded object-cover border border-zinc-100 cursor-zoom-in hover:opacity-80 transition-opacity"
          />
        ))}
      </div>
      {openIndex !== null && (
        <ImageLightbox
          images={pictures}
          initialIndex={openIndex}
          label={label}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  )
}
