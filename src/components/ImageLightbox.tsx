'use client'
import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  initialIndex: number
  label: string
  onClose: () => void
}

export default function ImageLightbox({ images, initialIndex, label, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const multi = images.length > 1

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (multi && e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      if (multi && e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [multi, images.length, onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        title="Close"
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
      >
        <X size={28} />
      </button>

      {multi && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length) }}
          title="Previous"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary
          uploaded file under public/uploads, not a build-known asset */}
      <img
        src={images[index]}
        alt={`${label} photo ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain rounded"
      />

      {multi && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length) }}
          title="Next"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {multi && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono text-white/70">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
