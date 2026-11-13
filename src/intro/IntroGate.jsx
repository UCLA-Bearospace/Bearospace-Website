import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import Img from '../components/Img'
import { sponsorList } from '../content/index.js'
import { BEAR_LINES, BEAR_STARS } from '../site/constellation.js'
import { useDirector } from '../motion/director'
import { replayIntro, takePendingReplay, useIntro } from './introStore'
import { useLoadProgress } from './progress'
import { startIntro } from './sequence'

// The opening sequence's overlay on the Flight Deck: the logo reveal (A), sponsor and
// institution recognition (B), a real loading bar while the scene finishes loading, and
// the Skip control. The 3D shots (C–F) play in the scene behind it.
//
// Rendered by the Flight Deck page, in the prerendered HTML too: CSS shows it only when <html> has
// data-intro="full|short" (set before first paint by the head script), so it is on screen
// from the first frame and never flashes on deep links. If JavaScript never runs, a CSS
// failsafe hides it after 7 s.

const SX = (x) => x * 100
const SY = (y) => -y * 100

export default function IntroGate() {
  const { pathname } = useLocation()
  const { mode, run } = useIntro()
  const directorRef = useDirector()
  const progress = useLoadProgress()
  const overlay = useRef(null)
  const ctl = useRef(null)
  const home = pathname === '/'

  // "Replay launch" pressed on another page: play once the Flight Deck is up
  useEffect(() => {
    if (home && takePendingReplay()) replayIntro()
  }, [home])

  useEffect(() => {
    if (!home || mode === 'off' || !overlay.current) return
    ctl.current = startIntro({ mode, overlay: overlay.current, getDirector: () => directorRef?.current })
    return () => ctl.current?.cancel()
  }, [home, mode, run, directorRef])

  if (!home) return null
  // Sponsors that share a kicker share a card ("Supported by": Anduril, then SendCutSend
  // under it), so the sequence keeps its timing however many sponsors there are
  const cards = sponsorList({ intro: true }).reduce((acc, s) => {
    const last = acc.at(-1)
    if (last?.kicker === s.introKicker) last.sponsors.push(s)
    else acc.push({ kicker: s.introKicker, relationship: s.relationship, sponsors: [s] })
    return acc
  }, [])

  return (
    <div className="intro" ref={overlay} role="region" aria-label="Opening sequence">
      <div className="intro__art" aria-hidden="true">
        <svg className="intro__constellation" viewBox="-110 -70 220 140">
          {BEAR_LINES.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              className="intro__line"
              pathLength="1"
              x1={SX(BEAR_STARS[a][0])}
              y1={SY(BEAR_STARS[a][1])}
              x2={SX(BEAR_STARS[b][0])}
              y2={SY(BEAR_STARS[b][1])}
            />
          ))}
          {BEAR_STARS.map(([x, y]) => (
            <circle key={`${x},${y}`} className="intro__star" cx={SX(x)} cy={SY(y)} r="4.5" />
          ))}
        </svg>
        <div className="intro__badge">
          <Img src="logos/bearospace-logo.png" alt="" sizes="(min-width: 40rem) 22rem, 60vw" eager />
          <span className="intro__sweep" />
        </div>
        {cards.map((card) => (
          <div key={card.sponsors[0].id} className={`intro__sponsor intro__sponsor--${card.relationship}`}>
            <p className="kicker">{card.kicker}</p>
            {card.sponsors.map((s) => (
              <span
                key={s.id}
                className={s.logo?.onDark ? (s.logo.invertOnDark ? 'intro__logo intro__logo--invert' : 'intro__logo') : 'intro__logo intro__logo--plate'}
              >
                <Img src={s.logo?.onDark ?? s.logo?.onLight} alt={s.name} sizes="70vw" />
              </span>
            ))}
          </div>
        ))}
        <div className="intro__flash" />
      </div>

      <div className="intro__progress" role="progressbar" aria-label="Loading the launch" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}>
        <span style={{ transform: `scaleX(${progress})` }} />
        <p>Preparing launch</p>
      </div>

      <button type="button" className="button intro__skip" onClick={() => ctl.current?.skip()}>
        Skip intro
      </button>
    </div>
  )
}
