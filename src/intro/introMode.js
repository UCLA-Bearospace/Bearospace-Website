// Decides how much of the opening sequence plays: 'full', 'short' (returning visitors),
// or 'off'. One pure function shared by three callers:
//   - scripts/prerender.mjs inlines it (via toString) in <head>, so html[data-intro] is set
//     before first paint and a deep link never flashes the intro;
//   - IntroGate calls it on the dev server, where there is no prerendered <head>;
//   - unit tests.
// Keep it self-contained: no imports, no closures (it is serialized).

export function decideIntroMode(env) {
  if (env.pathname !== '/') return 'off' // deep links land straight on their page
  if (/[?&]intro=0\b/.test(env.search) || /[?&]scene=0\b/.test(env.search)) return 'off'
  if (env.reducedMotion || env.motionPaused || env.introPref === 'off') return 'off'
  if (env.saveData || /(^|-)2g$/.test(env.effectiveType || '')) return 'off'
  if (env.sceneOff || !env.webgl || env.restored) return 'off'
  if (/[?&]intro=1\b/.test(env.search)) return 'full'
  return env.seen ? 'short' : 'full'
}

// Storage keys (also used by the inline head script, which reads them directly)
export const INTRO_SEEN_KEY = 'bearo:intro-seen'
export const INTRO_PREF_KEY = 'bearo:intro' // 'off' turns the intro off on this browser

/** Gathers the inputs in a browser. Also serialized into <head>: keep it self-contained. */
export function readIntroEnv() {
  const get = (store, key) => {
    try {
      return window[store].getItem(key)
    } catch {
      return null
    }
  }
  let webgl
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    webgl = Boolean(gl)
    if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webgl = false
  }
  const conn = navigator.connection || {}
  const nav = performance.getEntriesByType?.('navigation')?.[0]
  return {
    pathname: location.pathname,
    search: location.search,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    motionPaused: get('localStorage', 'bearo:motion-paused') === '1',
    introPref: get('localStorage', 'bearo:intro'),
    seen: get('localStorage', 'bearo:intro-seen') === '1',
    sceneOff: get('sessionStorage', 'bearo:scene-off') !== null,
    saveData: Boolean(conn.saveData),
    effectiveType: conn.effectiveType || '',
    webgl,
    restored: nav?.type === 'back_forward',
  }
}
