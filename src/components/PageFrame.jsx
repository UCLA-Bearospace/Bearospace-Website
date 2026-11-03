import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { isLandingLocation } from '../app/landing'

// Shared page chrome (adapted from the portfolio's SectionFrame): kicker, heading, lede.
// After an in-site navigation, focus moves to the h1 so screen readers announce the new
// page; the landing page keeps the browser's default focus.

export default function PageFrame({ kicker, title, lede, wide = false, children }) {
  const h1 = useRef(null)
  const { key } = useLocation()

  useEffect(() => {
    if (!isLandingLocation(key)) h1.current?.focus({ preventScroll: true })
  }, [key])

  return (
    <article className={`page${wide ? ' page--wide' : ''}`}>
      <header className="page__header">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 ref={h1} tabIndex={-1}>
          {title}
        </h1>
        {lede && <p className="lede">{lede}</p>}
      </header>
      {children}
    </article>
  )
}
