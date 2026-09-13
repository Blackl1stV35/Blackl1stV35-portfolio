interface Props {
  src?: string
  alt: string
}

export default function Thumbnail({ src, alt }: Props) {
  if (!src) return null
  // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded
  // file under public/uploads, not a build-known asset next/image can optimize
  return (
    <img
      src={src}
      alt={alt}
      className="w-14 h-14 rounded object-cover border border-zinc-100 flex-shrink-0"
    />
  )
}
