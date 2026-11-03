import { readStore } from './storage'

// Set after repeated context losses; the session stays on the static poster.
export const SCENE_OFF_KEY = 'bearo:scene-off'

let cached = null

/** True when a WebGL2 context can be created. The probe context is released immediately. */
export function hasWebGL() {
  if (cached !== null) return cached
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    cached = Boolean(gl)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  return cached
}

/** Whether the 3D scene should be attempted at all this session. */
export function sceneAllowed() {
  return readStore(SCENE_OFF_KEY, null, 'session') === null && hasWebGL()
}
