import { createContext, use } from 'react'

// The lazily loaded 3D scene fills this ref with its controls, so routing and the menu
// never import three.js (pattern from the portfolio's directorContext). null until the
// scene is ready, and again if it fails or is turned off.
//
//   travel(target)          → { finished: Promise, hurry(scale), finish() }
//   place(target)           cut the camera to a target
//   framing()               the target the camera is on (or heading to)
//   attachLabels(Map|null)  DOM elements to pin to the menu bodies
//   highlight(id|null)      hover/focus emphasis on a body
//   highlightZones(segs)    light up rocket sections for the system map (null clears)
//   visible()               false while the scene is paused behind a phone-width page
//   showBodies(bool)        hide the bodies while the menu is a plain list
//
// Targets come from src/site/targets.js: 'rest', 'join', or a destination id.

export const DirectorContext = createContext(null)

export const useDirector = () => use(DirectorContext)

// The rocket sections a page wants lit (the Engineering system map). Kept here, not only
// sent to the scene, because the scene may load after the page: it applies the latest
// request when it arrives (FlightScene). Segments are [fromNose, toNose] fractions.
let zoneRequest = null

/** Light rocket sections now, and whenever the scene (re)appears; null clears. */
export function requestRocketZones(directorRef, segments) {
  zoneRequest = segments
  directorRef?.current?.highlightZones?.(segments)
}

export const requestedRocketZones = () => zoneRequest
