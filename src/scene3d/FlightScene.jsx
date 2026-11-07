import { useEffect, useEffectEvent, useRef } from 'react'
import { useLocation } from 'react-router'
import { createEngine } from './engine'
import { useDirector } from '../motion/director'
import { targetFor } from '../site/targets.js'
import { reportProgress } from '../intro/progress'
import meta from '../generated/rocket.meta.json'

/**
 * Thin React host for the Three.js flight scene (lazy-loaded chunk).
 * The engine lives for the component's lifetime; later changes flow through setters.
 * It hands the route transitions and the menu a small "director" API (motion/director.js).
 */
export default function FlightScene({ motion, dimmed = false, onStatus, onEngine }) {
  const hostRef = useRef(null)
  const engineRef = useRef(null)
  const directorRef = useDirector()
  const { pathname } = useLocation()

  const report = useEffectEvent((status, model) => onStatus?.(status, model))
  const onMount = useEffectEvent((host) => {
    report('loading')
    const engine = createEngine(host, {
      meta,
      onProgress: (v) => reportProgress('model', v),
      onStatus: (s, m) => {
        if (s === 'ready') reportProgress('compile', 1)
        report(s, m)
      },
    })
    engine.setMotion(motion)
    // Deep link (or a scene that loaded late): open on the current page's shot
    engine.place(targetFor(pathname))
    engineRef.current = engine
    if (directorRef) {
      directorRef.current = {
        travel: (target) => engine.travel(target),
        place: (target) => engine.place(target),
        framing: () => engine.framing(),
        attachLabels: (map) => engine.attachLabels(map),
        highlight: (id) => engine.highlight(id),
        showBodies: (on) => engine.showBodies(on),
        intro: (mode, options) => engine.intro(mode, options),
      }
    }
    onEngine?.(engine)
    if (import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1') exposeTestHooks(engine)
    return engine
  })
  const onUnmount = useEffectEvent(() => {
    if (directorRef) directorRef.current = null
    onEngine?.(null)
  })

  useEffect(() => {
    const engine = onMount(hostRef.current)
    return () => {
      onUnmount()
      engineRef.current = null
      engine.dispose()
    }
  }, [])

  useEffect(() => {
    engineRef.current?.setMotion(motion)
  }, [motion])

  useEffect(() => {
    // Behind a content page the scene doesn't need 60 fps
    engineRef.current?.setFps(dimmed ? 30 : 60)
  }, [dimmed])

  return <div className="scene-host" ref={hostRef} aria-hidden="true" />
}

// Dev and test-build handle (window.__bearo); never present in production bundles.
function exposeTestHooks(engine) {
  const gl = engine.renderer.getContext()
  const lose = gl.getExtension('WEBGL_lose_context')
  window.__bearo = {
    ready: engine.ready,
    stats: () => engine.stats(),
    freeze: (t) => engine.freeze(t),
    setTier: (t) => engine.setTier(t),
    setPixelCap: (on) => engine.setPixelCap(on),
    loseContext: () => lose?.loseContext(),
    restoreContext: () => lose?.restoreContext(),
    /** The running (or last) intro's controls: hold(seconds | label), skip(), … */
    intro: () => engine.introControls,
    /** The scene state that the Flight Deck depends on (to check nothing is left over) */
    state: () => {
      const s = engine.state
      const pick = ['follow', 'target', 'altitude', 'dusk', 'speed', 'thrust', 'vacuum', 'lines', 'groundLock', 'shake', 'flash', 'appear']
      return Object.fromEntries(pick.map((k) => [k, s[k]]))
    },
  }
}
