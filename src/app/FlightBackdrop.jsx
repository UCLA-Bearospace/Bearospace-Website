import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import RocketPoster from './RocketPoster'
import SceneBoundary from './SceneBoundary'
import { setSceneStatus, useSceneStatus } from './sceneStatus'
import { disableScene, hasWebGL, useSceneAllowed } from '../lib/webgl'
import { useMediaQuery } from '../lib/useMediaQuery'
import { reportProgress } from '../intro/progress'
import { introMode } from '../intro/introStore'

// The 3D chunk is the biggest download: its arrival is 40% of the intro's progress bar
const FlightScene = lazy(() =>
  import('../scene3d/FlightScene.jsx').then((m) => {
    reportProgress('chunk', 1)
    return m
  }),
)

const LOSS_WINDOW_MS = 60_000

/**
 * The flying rocket behind the page. The static poster shows first and stays as the
 * fallback: no WebGL, a failed chunk or engine, or repeated GPU context losses.
 * `dimmed` (behind content pages) halves the frame rate.
 */
export default function FlightBackdrop({ motion, dimmed = false, onEngine }) {
  const allowed = useSceneAllowed()
  const [generation, setGeneration] = useState(0)
  // Load right away when the opening sequence is about to play (it needs the scene by shot C)
  const [idle, setIdle] = useState(() => typeof document !== 'undefined' && introMode() !== 'off')
  const lastLoss = useRef(0)
  const status = useSceneStatus()
  // On phone-width content pages the page panel covers the scene: skip the GPU and battery cost
  const narrow = useMediaQuery('(max-width: 62rem)')
  const wanted = allowed && !(dimmed && narrow)
  // Probe WebGL only now (slow without a GPU); no support turns `allowed` off, then status 'off'
  const load = wanted && idle && hasWebGL()
  // Once loaded, the scene stays: on phone-width pages it is hidden and paused, not torn
  // down, so the Flight Deck comes back instantly (and iPhones keep their WebGL context)
  const [kept, setKept] = useState(false)
  const mounted = allowed && (load || kept)
  if (load && !kept) setKept(true)
  // What the scene itself last reported; shown while it is wanted, 'none' while hidden
  const reported = useRef({ status: null, model: null })
  const wantedRef = useRef(wanted)

  useEffect(() => {
    wantedRef.current = wanted
    if (!allowed) setSceneStatus('off', null)
    else if (!wanted) setSceneStatus('none', null)
    else if (reported.current.status) setSceneStatus(reported.current.status, reported.current.model)
  }, [allowed, wanted])

  // Otherwise page content first: start loading the 3D scene once the browser is idle
  useEffect(() => {
    if (idle) return
    if (window.requestIdleCallback) {
      const id = requestIdleCallback(() => setIdle(true), { timeout: 2000 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(() => setIdle(true), 800)
    return () => clearTimeout(id)
  }, [idle])

  function handleStatus(next, model) {
    if (next === 'lost') {
      const now = performance.now()
      const repeated = lastLoss.current && now - lastLoss.current < LOSS_WINDOW_MS
      lastLoss.current = now
      reported.current = { status: 'lost', model: null }
      if (repeated) disableScene()
      else if (wantedRef.current) setSceneStatus('lost', null)
    } else if (next === 'restored') {
      // Re-create everything on a fresh context
      setGeneration((g) => g + 1)
    } else {
      reported.current = { status: next, model: model ?? null }
      if (wantedRef.current) setSceneStatus(next, model ?? null)
    }
  }

  const live = wanted && status === 'ready'
  return (
    <div className="backdrop" data-live={live || undefined} data-dimmed={dimmed || undefined}>
      <RocketPoster hidden={live} />
      {mounted && (
        <SceneBoundary onError={() => setSceneStatus('failed', null)}>
          <Suspense fallback={null}>
            <FlightScene key={generation} motion={motion} active={wanted} dimmed={dimmed} onStatus={handleStatus} onEngine={onEngine} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  )
}
