import media from '../generated/media.json'

/** The generated entry for an original under assets-src/images/ (see `npm run images`). */
export const mediaFor = (src) => (src ? media[src] : undefined)

export const hasMedia = (src) => Boolean(mediaFor(src))
