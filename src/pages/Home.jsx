import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { mailto, org } from '../content/index.js'
import { SponsorStrip } from '../components/bits'
import { isLandingLocation } from '../app/landing'
import { getLastDestination } from '../menu/menuState'
import OrbitNav from '../menu/OrbitNav'
import ReplayLaunch from '../intro/ReplayLaunch'
import IntroGate from '../intro/IntroGate'

/** The Flight Deck: title, calls to action, and the eight destinations. */
export default function Home() {
  const h1 = useRef(null)
  const { key } = useLocation()
  const landing = isLandingLocation(key)
  const returning = !landing && Boolean(getLastDestination())

  // After navigating here, focus the heading, or the destination they came back from
  useEffect(() => {
    if (!landing && !returning) h1.current?.focus({ preventScroll: true })
  }, [landing, returning])

  return (
    <div className="deck">
      <section className="deck__title" aria-labelledby="deck-title">
        <p className="kicker">{org.tagline}</p>
        <h1 id="deck-title" ref={h1} tabIndex={-1}>
          Bearospace
        </h1>
        <p className="lede">{org.lede}</p>
        <div className="cta-row">
          <Link className="button button--gold" to="/join">
            Join the team
          </Link>
          <a className="button" href={mailto('sponsorship')}>
            Sponsor a launch
          </a>
        </div>
      </section>

      <OrbitNav focusOnMount={returning} />

      <div className="deck__sponsors">
        <SponsorStrip />
        <ReplayLaunch className="button button--ghost deck__replay" />
      </div>

      {/* The opening sequence lives with the Flight Deck (and in its chunk) */}
      <IntroGate />
    </div>
  )
}
