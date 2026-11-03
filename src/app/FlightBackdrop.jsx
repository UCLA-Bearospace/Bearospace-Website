import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import RocketPoster from './RocketPoster'
import SceneBoundary from './SceneBoundary'
import { setSceneStatus, useSceneStatus } from './sceneStatus'
import { disableScene, useSceneAllowed } from '../lib/webgl'
import { useMediaQuery } from '../lib/useMediaQuery'

const FlightScene = lazy(() => import('../scene3d/FlightScene.jsx'))

const LOSS_WINDOW_MS = 60_000

/**
 * The flying rocket behind the page. The static poster shows first and stays as the
 * fallback: no WebGL, a failed chunk or engine, or repeated GPU context losses.
 * `dimmed` (behind content pages) halves the frame rate.
 */
export default function FlightBackdrop({ motion, dimmed = false, onEngine }) {
  const allowed = useSceneAllowed()
  const [generation, setGeneration] = useState(0)
  const [idle, setIdle] = useState(false)
  const lastLoss = useRef(0)
  const status = useSceneStatus()
  // On phone-width content pages the page panel covers the scene: skip the GPU and battery cost
  const narrow = useMediaQuery('(max-width: 62rem)')
  const wanted = allowed && !(dimmed && narrow)

  useEffect(() => {
    if (!allowed) setSceneStatus('off', null)
    else if (!wanted) setSceneStatus('none', null)
  }, [allowed, wanted])

  // Page content first: start loading the 3D scene once the browser is idle
  useEffect(() => {
    if (window.requestIdleCallback) {
      const id = requestIdleCallback(() => setIdle(true), { timeout: 2000 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(() => setIdle(true), 800)
    return () => clearTimeout(id)
  }, [])

  function handleStatus(next, model) {
    if (next === 'lost') {
      const now = performance.now()
      const repeated = lastLoss.current && now - lastLoss.current < LOSS_WINDOW_MS
      lastLoss.current = now
      if (repeated) disableScene()
      else setSceneStatus('lost', null)
    } else if (next === 'restored') {
      // Re-create everything on a fresh context
      setGeneration((g) => g + 1)
    } else setSceneStatus(next, model ?? null)
  }

  const live = wanted && status === 'ready'
  return (
    <div className="backdrop" data-live={live || undefined} data-dimmed={dimmed || undefined}>
      <RocketPoster hidden={live} />
      {wanted && idle && (
        <SceneBoundary onError={() => setSceneStatus('failed', null)}>
          <Suspense fallback={null}>
            <FlightScene key={generation} motion={motion} dimmed={dimmed} onStatus={handleStatus} onEngine={onEngine} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  )
}
