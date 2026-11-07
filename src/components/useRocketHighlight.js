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
    const segments = zones.filter((z) => ids.includes(z.id)).flatMap((z) => z.segments)
    requestRocketZones(director, segments.length ? segments : null)
    return () => requestRocketZones(director, null)
  }, [director, key])
}
