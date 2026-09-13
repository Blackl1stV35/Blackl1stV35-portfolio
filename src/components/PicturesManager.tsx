'use client'
import { useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'

interface Props {
  /** Array of existing URLs and/or freshly-picked data URLs, in display order */
  value: string[]
  onChange: (next: string[]) => void
  max?: number
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_FILE_BYTES = 5 * 1024 * 1024

export default function PicturesManager({ value, onChange, max = 10 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  // addFiles reads/appends through this ref instead of the `value` prop
  // directly — two overlapping addFiles() calls (e.g. two quick drops before
  // the first finishes reading its files) would otherwise both close over the
  // same stale `value` and the second onChange() would silently clobber the
  // first's additions. The ref is updated synchronously in the same tick each
  // batch resolves, so a later batch always appends onto the latest list.
  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])

  function addFiles(files: FileList | File[]) {
    const room = max - valueRef.current.length
    if (room <= 0) { alert(`Max ${max} pictures`); return }

    const candidates = Array.from(files).slice(0, room)
    let skipped = false

    Promise.all(candidates.map((file) => new Promise<string | null>((resolve) => {
      if (!file.type.startsWith('image/')) { skipped = true; resolve(null); return }
      if (file.size > MAX_FILE_BYTES) { skipped = true; resolve(null); return }
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => { skipped = true; resolve(null) }
      reader.readAsDataURL(file)
    }))).then((results) => {
      const added = results.filter((r): r is string => !!r)
      if (skipped) alert('Some files were skipped (images only, max 5 MB each)')
      if (added.length) {
        const next = [...valueRef.current, ...added]
        valueRef.current = next
        onChange(next)
      }
    })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) addFiles(e.target.files)
    e.target.value = ''
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  function reorder(from: number, to: number) {
    if (!Number.isFinite(from) || from === to || from < 0 || from >= value.length) return
    const next = [...value]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div
      className="flex flex-wrap gap-2 border border-dashed border-zinc-300 rounded p-2"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
      }}
    >
      {value.map((src, i) => (
        <div
          key={i}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // an OS file drop lands on a tile too — treat that as bulk-add,
            // not a reorder, otherwise dropping new files onto an existing
            // tile would silently do nothing
            if (e.dataTransfer.files?.length) { addFiles(e.dataTransfer.files); return }
            reorder(Number(e.dataTransfer.getData('text/plain')), i)
          }}
          className="relative w-16 h-16 cursor-move group"
          title="Drag to reorder"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary
              uploaded/data-URL preview, not a build-known asset */}
          <img src={src} alt="" className="w-full h-full object-cover rounded border border-zinc-200" />
          <button
            type="button"
            onClick={() => removeAt(i)}
            title="Remove picture"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-zinc-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
          >
            <X size={10} className="text-zinc-600" />
          </button>
        </div>
      ))}

      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          title="Add pictures"
          className="w-16 h-16 flex flex-col items-center justify-center rounded border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-50 transition-colors"
        >
          <Plus size={18} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
