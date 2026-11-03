import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import RocketPoster from './RocketPoster'
import SceneBoundary from './SceneBoundary'
import { setSceneStatus, useSceneStatus } from './sceneStatus'
import { SCENE_OFF_KEY, sceneAllowed } from '../lib/webgl'
import { writeStore } from '../lib/storage'

const FlightScene = lazy(() => import('../scene3d/FlightScene.jsx'))

const LOSS_WINDOW_MS = 60_000

/**
 * The flying rocket behind the page. The static poster shows first and stays as the
 * fallback: no WebGL, a failed chunk or engine, or repeated GPU context losses.
 */
export default function FlightBackdrop({ motion, onEngine }) {
  const [allowed, setAllowed] = useState(sceneAllowed)
  const [generation, setGeneration] = useState(0)
  const lastLoss = useRef(0)
  const status = useSceneStatus()

  useEffect(() => {
    if (!allowed) setSceneStatus('off', null)
  }, [allowed])

  function handleStatus(next, model) {
    if (next === 'lost') {
      const now = performance.now()
      const repeated = lastLoss.current && now - lastLoss.current < LOSS_WINDOW_MS
      lastLoss.current = now
      if (repeated) {
        writeStore(SCENE_OFF_KEY, '1', 'session')
        setAllowed(false)
      } else setSceneStatus('lost', null)
    } else if (next === 'restored') {
      // Re-create everything on a fresh context
      setGeneration((g) => g + 1)
    } else setSceneStatus(next, model ?? null)
  }

  const live = allowed && status === 'ready'
  return (
    <div className="backdrop" data-live={live || undefined}>
      <RocketPoster hidden={live} />
      {allowed && (
        <SceneBoundary onError={() => setSceneStatus('failed', null)}>
          <Suspense fallback={null}>
            <FlightScene key={generation} motion={motion} onStatus={handleStatus} onEngine={onEngine} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  )
}
