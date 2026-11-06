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
//   showBodies(bool)        hide the bodies while the menu is a plain list
//
// Targets come from src/site/targets.js: 'rest', 'join', or a destination id.

export const DirectorContext = createContext(null)

export const useDirector = () => use(DirectorContext)
