'use client'
import { useState } from 'react'
import ImageLightbox from './ImageLightbox'

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
        {pictures.map((src, i) => (
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
