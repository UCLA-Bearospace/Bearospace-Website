import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { getMeta } from '../site/meta.js'
import { org } from '../content/index.js'
import { readStore, writeStore } from '../lib/storage'
import { useAnnouncement } from './announcer'
import { isLandingLocation } from './landing'

// Route side effects that are not page content: document metadata, scroll restoration,
// and status announcements. On the landing page none of these move anything.

export function RouteMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const meta = getMeta(pathname)
    document.title = meta.title
    const set = (selector, attr, value) => {
      let el = document.head.querySelector(selector)
      if (!el) {
        el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
        if (selector.startsWith('link')) el.rel = 'canonical'
        else el.setAttribute(selector.includes('property') ? 'property' : 'name', selector.match(/"(.+)"/)[1])
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }
    set('meta[name="description"]', 'content', meta.description)
    set('meta[property="og:title"]', 'content', meta.title)
    set('meta[property="og:description"]', 'content', meta.description)
    if (org.siteUrl) set('link[rel="canonical"]', 'href', `${org.siteUrl}${meta.path}`)
    set('meta[name="robots"]', 'content', meta.noindex ? 'noindex' : 'index,follow')
  }, [pathname])
  return null
}

const SCROLL_KEY = 'bearo:scroll'

export function ScrollManager() {
  const location = useLocation()
  const saved = useRef(null)

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    saved.current = JSON.parse(readStore(SCROLL_KEY, '{}', 'session'))
  }, [])

  // Remember where each history entry was scrolled to
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        saved.current = { ...saved.current, [location.key]: window.scrollY }
        writeStore(SCROLL_KEY, JSON.stringify(saved.current), 'session')
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [location.key])

  // Back/Forward restores; new pages start at the top (or at their #hash). This renders
  // under <Routes location={displayLocation}>, where react-router reports every navigation
  // as POP, so a history entry with a saved position is the sign of a return visit.
  useLayoutEffect(() => {
    if (isLandingLocation(location.key)) return
    // (Only ever return a cleanup function from here: React calls whatever comes back)
    const restore = saved.current?.[location.key]
    if (restore !== undefined) {
      window.scrollTo(0, restore)
      return
    }
    const id = location.hash ? decodeURIComponent(location.hash.slice(1)) : ''
    const target = id ? document.getElementById(id) : null
    if (target) {
      target.scrollIntoView()
      return
    }
    window.scrollTo(0, 0)
    if (!id) return
    // Coming from another page, the target arrives with the lazily loaded page: wait for it
    const observer = new MutationObserver(() => {
      const el = document.getElementById(id)
      if (el) {
        observer.disconnect()
        el.scrollIntoView()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const giveUp = setTimeout(() => observer.disconnect(), 5000)
    return () => {
      observer.disconnect()
      clearTimeout(giveUp)
    }
  }, [location.key, location.hash])

  return null
}

export function Announcer() {
  const message = useAnnouncement()
  return (
    <div className="sr-only" role="status" aria-live="polite">
      {message}
    </div>
  )
}
