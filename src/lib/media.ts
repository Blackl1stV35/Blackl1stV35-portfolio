// Gallery entries are plain URL strings. Anything ending in a browser-playable
// video extension renders as a video tile; everything else stays an image.
export function isVideo(src: string): boolean {
  return /\.(mp4|webm)(#.*)?$/i.test(src)
}
