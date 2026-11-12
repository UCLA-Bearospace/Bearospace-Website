import media from '../generated/media.json'

/**
 * The generated entry for an original under assets-src/images/ (see `npm run images`),
 * with its file URLs. The manifest stores only the widths (it ships in the main script);
 * every file is /media/<folder>/<name>-<width>.<avif|webp>, and SVG logos are copied as-is.
 */
export function mediaFor(src) {
  const m = src && media[src]
  if (!m) return undefined
  if (m.svg) return { ...m, svg: `/media/${src}` }
  const files = (format) => m.w.map((w) => ({ w, url: `/media/${src.replace(/\.\w+$/, '')}-${w}.${format}` }))
  return { ...m, avif: files('avif'), webp: files('webp') }
}

export const hasMedia = (src) => Boolean(mediaFor(src))
