import { useEffect, useEffectEvent, useRef } from 'react'
import { createEngine } from './engine'
import meta from '../generated/rocket.meta.json'

/**
 * Thin React host for the Three.js flight scene (lazy-loaded chunk).
 * The engine lives for the component's lifetime; later changes flow through setters.
 */
export default function FlightScene({ motion, onStatus, onEngine }) {
  const hostRef = useRef(null)
  const engineRef = useRef(null)

  const report = useEffectEvent((status, model) => onStatus?.(status, model))
  const onMount = useEffectEvent((host) => {
    report('loading')
    const engine = createEngine(host, { meta, onStatus: (s, m) => report(s, m) })
    engine.setMotion(motion)
    engineRef.current = engine
    onEngine?.(engine)
    if (import.meta.env.DEV || import.meta.env.VITE_TEST_HOOKS === '1') exposeTestHooks(engine)
    return engine
  })
  const onUnmount = useEffectEvent(() => onEngine?.(null))

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
    loseContext: () => lose?.loseContext(),
    restoreContext: () => lose?.restoreContext(),
  }
}
