// Which part of the 3D scene each URL frames, and where Esc goes from each URL.
// Plain JS: shared by the route transitions (main bundle) and the scene chunk.

import { destinations } from './destinations.js'
import { getMeta } from './meta.js'

export const BODY_IDS = destinations.map((d) => d.id)

/** 'rest' (the Flight Deck shot), 'join' (the rocket, framed right), or a body id. */
export function targetFor(pathname) {
  const section = pathname.split('/')[1]
  if (!section) return 'rest'
  if (section === 'join') return 'join'
  return BODY_IDS.includes(section) ? section : 'rest'
}

/** One level up: /team/joel-venegas → /team, /team/season/2025-26 → /team, /about → / */
export function parentOf(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return null
  if (parts[1] === 'season') return `/${parts[0]}`
  return parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : '/'
}

/** Name shown on the transition wipe. */
export function labelFor(pathname) {
  if (pathname === '/') return 'Flight Deck'
  const meta = getMeta(pathname)
  return meta.notFound ? 'Lost signal' : meta.crumbs.at(-1).label
}
