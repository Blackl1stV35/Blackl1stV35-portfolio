interface Props {
  pictures?: string[]
  label: string
}

export default function PictureStrip({ pictures, label }: Props) {
  if (!pictures || pictures.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {pictures.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary
        // uploaded file under public/uploads, not a build-known asset
        <img
          key={i}
          src={src}
          alt={`${label} photo ${i + 1}`}
          className="h-28 w-28 rounded object-cover border border-zinc-100"
        />
      ))}
    </div>
  )
}
