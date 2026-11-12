import { useEffect } from 'react'
import { requestRocketZones, useDirector } from '../motion/director'
import { zones } from '../content/index.js'

/**
 * Light up rocket sections on the 3D rocket behind the page (desktop; on phones the scene
 * is paused behind content pages and nothing shows). A scene that loads after the page
 * picks the request up when it arrives. Cleared on unmount.
 */
export function useRocketHighlight(zoneIds) {
  const director = useDirector()
  const key = zoneIds.join(' ')

  useEffect(() => {
    const ids = key ? key.split(' ') : []
    // The rocket shader draws at most two bands: bays that touch become one band
    const segments = []
    for (const [from, to] of zones
      .filter((z) => ids.includes(z.id))
      .flatMap((z) => z.segments)
      .sort((a, b) => a[0] - b[0])) {
      const last = segments.at(-1)
      if (last && from <= last[1] + 1e-6) last[1] = Math.max(last[1], to)
      else segments.push([from, to])
    }
    requestRocketZones(director, segments.length ? segments : null)
    return () => requestRocketZones(director, null)
  }, [director, key])
}
