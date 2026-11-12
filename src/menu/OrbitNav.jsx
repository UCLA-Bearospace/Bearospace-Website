import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { destinations } from '../site/destinations.js'
import { useDirector } from '../motion/director'
import { useSceneStatus } from '../app/sceneStatus'
import { useMediaQuery } from '../lib/useMediaQuery'
import { getLastDestination, setLastDestination } from './menuState'

// The Flight Deck destinations: one set of real links, in two layouts.
//   orbit  each link is pinned to its body in the 3D scene (the engine positions it)
//   list   a plain vertical list: phones, portrait screens, no WebGL, while the scene
//          loads, and the prerendered HTML
// Paused or reduced motion keeps the orbit layout on a still frame (the engine draws one
// frame and pins the labels): switching to the list confused visitors (content review).
// One link is tabbable at a time (roving tabindex); arrow keys move in reading order,
// which is also the constellation's top-to-bottom order. Home/End jump to the ends.

const ORBIT_QUERY = '(min-width: 900px) and (min-aspect-ratio: 9/10)'
const noop = () => () => {}
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )

export default function OrbitNav({ focusOnMount = false }) {
  const status = useSceneStatus()
  const wide = useMediaQuery(ORBIT_QUERY)
  const hydrated = useHydrated()
  const orbit = hydrated && status === 'ready' && wide
  const directorRef = useDirector()
  const nav = useRef(null)
  const items = useRef(new Map())
  const links = useRef(new Map())
  const [active, setActive] = useState(() => getLastDestination() ?? destinations[0].id)

  // Hand the label elements to the scene (orbit), or hide the bodies behind the list.
  // Re-runs when the scene becomes ready: it usually loads after the deck has mounted.
  useEffect(() => {
    const director = directorRef?.current
    if (!director || status !== 'ready') return
    if (orbit) {
      director.showBodies(true)
      director.attachLabels(items.current)
    } else director.showBodies(false)
    return () => {
      director.attachLabels(null)
      director.highlight(null)
      director.showBodies(true)
    }
  }, [orbit, status, directorRef])

  // The scene and the labels are fixed to the screen, but the deck is part of the page:
  // scrolling down to the footer lifts both with the page, so the footer arrives below
  // the lowest bodies instead of sliding over them (content review).
  useEffect(() => {
    if (!orbit) return
    const layers = [document.querySelector('.scene-host'), nav.current].filter(Boolean)
    let raf = 0
    const lift = () => {
      raf = 0
      const y = Math.max(0, window.scrollY)
      for (const el of layers) el.style.transform = y ? `translate3d(0, ${-y}px, 0)` : ''
    }
    const onScroll = () => (raf ||= requestAnimationFrame(lift))
    lift()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      for (const el of layers) el.style.transform = ''
    }
  }, [orbit])

  // Back on the deck after visiting a destination: focus returns to it
  useEffect(() => {
    if (focusOnMount) links.current.get(getLastDestination())?.focus({ preventScroll: true })
  }, [focusOnMount])

  function move(e, index) {
    const last = destinations.length - 1
    const next = {
      ArrowDown: Math.min(last, index + 1),
      ArrowRight: Math.min(last, index + 1),
      ArrowUp: Math.max(0, index - 1),
      ArrowLeft: Math.max(0, index - 1),
      Home: 0,
      End: last,
    }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const id = destinations[next].id
    setActive(id)
    links.current.get(id)?.focus()
  }

  const engage = (id) => {
    items.current.get(id).dataset.hold = '1'
    directorRef?.current?.highlight(id)
  }
  const release = (id) => {
    delete items.current.get(id).dataset.hold
    directorRef?.current?.highlight(null)
  }

  return (
    <nav ref={nav} className="deck__destinations" aria-label="Destinations" data-layout={orbit ? 'orbit' : 'list'}>
      <ul>
        {destinations.map((d, i) => (
          <li
            key={d.id}
            className="destination-item"
            ref={(el) => {
              if (el) items.current.set(d.id, el)
              else items.current.delete(d.id)
            }}
          >
            <Link
              to={d.path}
              className="destination"
              ref={(el) => {
                if (el) links.current.set(d.id, el)
                else links.current.delete(d.id)
              }}
              tabIndex={hydrated ? (d.id === active ? 0 : -1) : undefined}
              onKeyDown={(e) => move(e, i)}
              onFocus={() => {
                setActive(d.id)
                engage(d.id)
              }}
              onBlur={() => release(d.id)}
              onPointerEnter={() => engage(d.id)}
              onPointerLeave={() => release(d.id)}
              onClick={() => setLastDestination(d.id)}
            >
              <span className="destination__hit" aria-hidden="true" />
              <span className="destination__label">{d.label}</span>
              <span className="destination__descriptor">{d.descriptor}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
