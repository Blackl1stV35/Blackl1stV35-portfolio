'use client'
import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface Props {
  /** Initial image URL (from saved state / env) */
  src?: string
  /** Initials to show when no image */
  initials?: string
  /** Called with a base64 data URL or blob URL after pick */
  onChange?: (dataUrl: string | null) => void
  /** Extra class for the outer wrapper */
  className?: string
  /** Size in px, default 160 */
  size?: number
}

export default function AvatarUpload({ src, initials = '?', onChange, className = '', size = 160 }: Props) {
  const [preview, setPreview] = useState<string | null>(src ?? null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Images only (JPG, PNG, WebP, GIF)'); return }
    if (file.size > 5 * 1024 * 1024) { alert('Max 5 MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setPreview(url)
      onChange?.(url)
    }
    reader.readAsDataURL(file)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    setPreview(null)
    onChange?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      className={`relative cursor-pointer group ${className}`}
      style={{ width: size, height: size }}
      onClick={() => inputRef.current?.click()}
      title="Click to upload photo"
    >
      {/* Image or initials placeholder */}
      {preview ? (
        <img
          src={preview}
          alt="Author photo"
          className="w-full h-full object-cover rounded border border-zinc-200"
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center rounded border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition-colors group-hover:border-zinc-500 group-hover:bg-zinc-100"
        >
          <span className="text-3xl font-serif font-bold mb-1">{initials}</span>
          <span className="text-xs font-mono">click to upload</span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Upload size={20} className="text-white" />
      </div>

      {/* Clear button — only when image is set */}
      {preview && (
        <button
          onClick={handleClear}
          title="Remove photo"
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-zinc-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        >
          <X size={10} className="text-zinc-600" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
