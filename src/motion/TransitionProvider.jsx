import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { TransitionContext } from './transitionContext'
import { DirectorContext } from './director'
import { useMotionAllowed } from './useMotionPref'
import { EASE, PAGE_FADE, REDUCED, TRAVEL_CAP, WIPE } from './timing'
import WipeLayer from './WipeLayer'
import { BODY_IDS, labelFor, parentOf, targetFor } from '../site/targets.js'
import { setLastDestination } from '../menu/menuState'

// Every route change (links, Back/Forward, Esc) goes through here. Ported from the
// portfolio's TransitionProvider; the wipe runs on the Web Animations API so GSAP stays
// in the 3D chunk.
//
// The rendered location lags the URL:
//   1. travel  the camera flies to the new page's body while the old page fades
//   2. cover   bands sweep across, labelled with the destination
//   3. swap    the new page renders under the cover (the camera cuts if it isn't framing it)
//   4. reveal  the bands clear
//
// Rapid navigation: one run at a time; the newest URL wins. A URL change during the
// travel retargets the run before the cover, so label and page always agree (the
// portfolio's version could label one page and show another). A change during the
// cover queues one more run, which skips the travel. Any key or click speeds a travel
// up ×3. Reduced or paused motion: a quick fade, with a camera cut.

const depth = (pathname) => pathname.split('/').filter(Boolean).length
const translate = (x) => ({ transform: `translateX(${x}%)` })

/** html[data-transition]: travel | cover | reveal | fade (tests and CSS read it). */
function setPhase(phase) {
  const root = document.documentElement
  if (phase) root.dataset.transition = phase
  else delete root.dataset.transition
}

export default function TransitionProvider({ children, preload }) {
  const location = useLocation()
  const navigate = useNavigate()
  const motion = useMotionAllowed()
  const [displayLocation, setDisplayLocation] = useState(location)

  const directorRef = useRef(null)
  const wipeRef = useRef(null)
  const labelRef = useRef(null)
  const latest = useRef(location)
  const shownPath = useRef(location.pathname)
  const running = useRef(false)
  const motionRef = useRef(motion)
  const live = useRef(new Set()) // animations and travels in flight, for hidden-tab finishing

  // Same path with a new history entry (search/hash): follow without a transition
  if (location.pathname === displayLocation.pathname && location.key !== displayLocation.key) {
    setDisplayLocation(location)
  }

  useEffect(() => {
    motionRef.current = motion
  }, [motion])

  /** Track an animation (or travel) so it can be finished early; resolves when done. */
  function play(item) {
    live.current.add(item)
    if (document.hidden) item.finish()
    const done = item.finished.catch(() => {})
    done.then(() => live.current.delete(item))
    return done
  }

  function setLabel(pathname) {
    const el = labelRef.current
    if (!el) return
    const label = labelFor(pathname)
    el.textContent = label
    // Long names shrink to fit the viewport instead of overflowing
    const fit = (window.innerWidth * 0.8) / (label.length * 0.62)
    el.style.fontSize = `${Math.min(window.innerWidth * 0.12, fit, 180)}px`
  }

  function swap(target) {
    const t = targetFor(target.pathname)
    const director = directorRef.current
    // No travel happened (reduced motion, a queued run, a late scene): cut the camera under the cover
    if (director && director.framing() !== t) director.place(t)
    // Returning to the Flight Deck: focus goes back to the destination they came from
    if (target.pathname === '/') {
      const from = targetFor(shownPath.current)
      if (BODY_IDS.includes(from)) setLastDestination(from)
    }
    shownPath.current = target.pathname
    // A transition keeps the old page up if the new page's chunk is still loading
    startTransition(() => setDisplayLocation(target))
  }

  // A click or key during a camera travel speeds it up (Esc and Tab still do their jobs)
  function hurry(travel) {
    const h = (e) => {
      if (e.type === 'keydown' && ['Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return
      travel.hurry(3)
    }
    window.addEventListener('keydown', h)
    window.addEventListener('pointerdown', h)
    return () => {
      window.removeEventListener('keydown', h)
      window.removeEventListener('pointerdown', h)
    }
  }

  async function run(queued) {
    running.current = true
    const main = document.getElementById('main')
    let target = latest.current
    const director = directorRef.current
    preload?.(target.pathname)

    // Reduced or paused motion: fade out, swap, fade in
    if (!motionRef.current || !wipeRef.current) {
      setPhase('fade')
      const out = main?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED.out, fill: 'forwards' })
      if (out) await play(out)
      target = latest.current
      swap(target)
      out?.cancel()
      const back = main?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED.in })
      if (back) await play(back)
      return done()
    }

    // 1. Travel to the new page's body while the old page steps aside
    let fade = null
    const t = targetFor(target.pathname)
    if (!queued && director && director.framing() !== t) {
      setPhase('travel')
      fade = main?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: PAGE_FADE, easing: EASE.fade, fill: 'forwards' })
      const travel = director.travel(t)
      const stop = hurry(travel)
      const cap = setTimeout(() => travel.finish(), TRAVEL_CAP)
      await play(travel)
      clearTimeout(cap)
      stop()
      // The URL moved on while we flew: land on the newest page instead
      target = latest.current
      preload?.(target.pathname)
    }

    // 2. Cover
    setPhase('cover')
    setLabel(target.pathname)
    const rate = queued ? 1.6 : 1
    const dir = depth(target.pathname) >= depth(shownPath.current) ? 1 : -1
    const wipe = wipeRef.current
    const bands = [...wipe.querySelectorAll('.wipe-band')]
    wipe.style.visibility = 'visible'
    const total = WIPE.cover + WIPE.hold + WIPE.reveal + WIPE.stagger * 2
    const drift = labelRef.current.animate(
      [{ transform: `translateX(${-50 - 12 * dir}%)` }, { transform: `translateX(${-50 + 12 * dir}%)` }],
      { duration: total / rate, fill: 'forwards' },
    )
    // The labelled middle band leads in...
    const cover = bands.map((band, i) =>
      band.animate([translate(-118 * dir), translate(0)], {
        duration: WIPE.cover / rate,
        delay: (i === 1 ? 0 : WIPE.stagger) / rate,
        easing: EASE.sweepIn,
        fill: 'forwards',
      }),
    )
    await Promise.all(cover.map(play))

    // 3. Swap under the cover
    swap(target)
    fade?.cancel()

    // 4. ...and leaves last
    setPhase('reveal')
    const reveal = bands.map((band, i) =>
      band.animate([translate(0), translate(118 * dir)], {
        duration: WIPE.reveal / rate,
        delay: (WIPE.hold + (i === 1 ? WIPE.stagger : 0)) / rate,
        easing: EASE.sweepOut,
        fill: 'forwards',
      }),
    )
    await Promise.all(reveal.map(play))
    wipe.style.visibility = 'hidden'
    for (const a of [...cover, ...reveal, drift]) a.cancel()
    done()
  }

  function done() {
    running.current = false
    setPhase(null)
    if (latest.current.pathname !== shownPath.current) run(true)
  }

  const onLocation = useEffectEvent((loc) => {
    latest.current = loc
    if (!running.current && loc.pathname !== shownPath.current) run(false)
  })
  useEffect(() => {
    onLocation(location)
  }, [location])

  // A hidden tab can't animate: finish whatever is running so the page lands
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) for (const item of live.current) item.finish()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Esc goes up one level: /team/x → /team → Flight Deck
  const onKey = useEffectEvent((e) => {
    if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('dialog[open]')) return
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
    const parent = parentOf(latest.current.pathname)
    if (parent) navigate(parent)
  })
  useEffect(() => {
    const h = (e) => onKey(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <DirectorContext value={directorRef}>
      <TransitionContext value={{ displayLocation }}>
        {children}
        <WipeLayer ref={wipeRef} labelRef={labelRef} />
      </TransitionContext>
    </DirectorContext>
  )
}
