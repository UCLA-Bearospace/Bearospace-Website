import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { destinations } from '../site/destinations.js'
import { mailto, org } from '../content/index.js'
import { SponsorStrip } from '../components/bits'
import { isLandingLocation } from '../app/landing'

/** The Flight Deck in its list layout (slice 3 adds the 3D orbit layout). */
export default function Home() {
  const h1 = useRef(null)
  const { key } = useLocation()
  useEffect(() => {
    if (!isLandingLocation(key)) h1.current?.focus({ preventScroll: true })
  }, [key])

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

      <nav className="deck__destinations" aria-label="Destinations">
        <ul>
          {destinations.map((d) => (
            <li key={d.id}>
              <Link to={d.path} className="destination">
                <span className="destination__label">{d.label}</span>
                <span className="destination__descriptor">{d.descriptor}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="deck__sponsors">
        <SponsorStrip />
      </div>
    </div>
  )
}
