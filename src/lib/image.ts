// Shrinks a picked photo in the browser before it is uploaded. A phone camera
// photo is 3 to 8 MB, and the host rejects any request body over about 4.5 MB,
// so one or two photos made the admin save fail. Small and animated files pass
// through untouched.
const PASS_THROUGH_BYTES = 600 * 1024

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function imageToDataUrl(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  if (file.type === 'image/gif' || file.size <= PASS_THROUGH_BYTES) return readAsDataUrl(file)
  try {
    // 'from-image' applies the camera's rotation, so portrait photos stay upright
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return readAsDataUrl(file)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    return blob && blob.size < file.size ? readAsDataUrl(blob) : readAsDataUrl(file)
  } catch {
    // a format this browser cannot decode: keep the original bytes
    return readAsDataUrl(file)
  }
}

// The host takes about 4.5 MB per request, and the admin sends every new picture
// as base64 inside one request, so cap the unsaved picture data below that.
export const MAX_UNSAVED_PICTURE_CHARS = 3_800_000
