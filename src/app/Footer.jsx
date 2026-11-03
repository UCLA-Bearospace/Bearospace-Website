import { Link } from 'react-router'
import { destinations } from '../site/destinations.js'
import { links, org } from '../content/index.js'
import { SponsorStrip } from '../components/bits'

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav id="site-nav" aria-label="Site" className="site-footer__nav">
        <h2 className="sr-only">Site navigation</h2>
        <ul>
          <li>
            <Link to="/">Flight Deck</Link>
          </li>
          {destinations.map((d) => (
            <li key={d.id}>
              <Link to={d.path}>{d.label}</Link>
            </li>
          ))}
          <li>
            <Link to="/join">Join & contact</Link>
          </li>
        </ul>
      </nav>

      <div className="site-footer__contact">
        <p>
          <strong>{org.name}</strong>
          <br />
          {org.location.building}, Room {org.location.room} · {org.location.campus}
        </p>
        <ul className="inline-list">
          <li>
            <a href={`mailto:${links.email}`}>{links.email}</a>
          </li>
          <li>
            <a href={links.instagram}>Instagram</a>
          </li>
          <li>
            <a href={links.linkedin}>LinkedIn</a>
          </li>
        </ul>
      </div>

      <SponsorStrip />

      <p className="site-footer__fine">
        A student organization at UCLA and the technical project of{' '}
        <a href={org.parents.aises.url}>{org.parents.aises.name}</a>.
      </p>
    </footer>
  )
}
