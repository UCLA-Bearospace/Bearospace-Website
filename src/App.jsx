import FlightBackdrop from './app/FlightBackdrop'
import { setMotionPaused, useMotionAllowed, useMotionPaused, useReducedMotion } from './motion/useMotionPref'

// Holding page until slice 2 (routes, content model, prerender) lands; it also shows
// off the slice 1 rocket prototype. See docs/PLAN.md §11.
function App() {
  const motion = useMotionAllowed()
  const paused = useMotionPaused()
  const reduced = useReducedMotion()

  return (
    <>
      <FlightBackdrop motion={motion} />
      <main className="placeholder">
        <p className="kicker">Bearospace at UCLA</p>
        <h1>A new launch is in progress.</h1>
        <p>
          We're building a new home for UCLA's student rocketry team. Until it
          lands, reach us at{' '}
          <a href="mailto:ucla.bearospace@gmail.com">ucla.bearospace@gmail.com</a>
          .
        </p>
        <ul className="links">
          <li>
            <a href="https://www.instagram.com/uclabearospace/">Instagram</a>
          </li>
          <li>
            <a href="https://www.linkedin.com/company/bearospace-ucla/">LinkedIn</a>
          </li>
        </ul>
      </main>
      {!reduced && (
        <button
          type="button"
          className="motion-toggle"
          aria-pressed={paused}
          onClick={() => setMotionPaused(!paused)}
        >
          {paused ? 'Play motion' : 'Pause motion'}
        </button>
      )}
    </>
  )
}

export default App
