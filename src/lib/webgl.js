import { useSyncExternalStore } from 'react'
import { readStore, writeStore } from './storage'

// Set after repeated context losses; the session stays on the static poster.
export const SCENE_OFF_KEY = 'bearo:scene-off'

let cached = null
const listeners = new Set()

/**
 * True when a WebGL2 context can be created. The probe context is released immediately.
 * Creating one is slow without a GPU (software GL), so call this only when the scene is
 * about to load, never while a page is hydrating. A failure turns the scene off for
 * subscribers of useSceneAllowed().
 */
export function hasWebGL() {
  if (cached !== null) return cached
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    cached = Boolean(gl)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  // Notify after the current render, not during it
  if (!cached) queueMicrotask(() => listeners.forEach((cb) => cb()))
  return cached
}

/** Turn 3D off for the rest of this session. */
export function disableScene() {
  writeStore(SCENE_OFF_KEY, '1', 'session')
  for (const cb of listeners) cb()
}

// ?scene=0 forces the static poster (DOM-only screenshots, debugging). Cheap checks only:
// WebGL support counts once something has probed it (hasWebGL)
const sceneAllowed = () =>
  !/[?&]scene=0\b/.test(window.location.search) && readStore(SCENE_OFF_KEY, null, 'session') === null && cached !== false

/**
 * Whether the 3D scene may be attempted. Always false while prerendering and during
 * hydration (the static HTML shows the poster), then the real answer on the client.
 */
export function useSceneAllowed() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    sceneAllowed,
    () => false,
  )
}
