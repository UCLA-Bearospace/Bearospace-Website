import { Link } from 'react-router'
import PageFrame from '../components/PageFrame'
import { SponsorLogo } from '../components/bits'
import { links, mailto, pastPartners, sponsorList } from '../content/index.js'

const SUPPORT_BUILDS = [
  ['Flight hardware', 'Carbon fiber, fiberglass, epoxies, aluminum, motors, and electronics for each season’s rocket and payload.'],
  ['Testing', 'Ground tests, recovery tests, and launches that turn a design into a proven vehicle.'],
  ['Competition', 'Travel and entry costs so the team can compete and present its work.'],
  ['First-time engineers', 'The chance for students who have never built flight hardware to do it for real.'],
]

export default function Sponsors() {
  return (
    <PageFrame
      kicker="Sponsors"
      title="Our supporters"
      lede="Bearospace is built by students and made possible by the organizations that back them."
    >
      <ul className="sponsor-list">
        {sponsorList().map((s) => (
          <li key={s.id} className={`sponsor-card sponsor-card--${s.relationship}`}>
            <p className="kicker">{s.label}</p>
            <h2 className="sponsor-card__name">{s.url ? <a href={s.url}>{s.name}</a> : s.name}</h2>
            {s.logo && <SponsorLogo sponsor={s} height={s.relationship === 'sponsor' ? 56 : 40} />}
          </li>
        ))}
      </ul>

      {pastPartners().length > 0 && (
        <section aria-labelledby="past-partners">
          <h2 id="past-partners">Past meeting partners and collaborators</h2>
          <p>Organizations that have met with our members, shared their expertise, or collaborated with the team.</p>
          <ul className="sponsor-list">
            {pastPartners().map((s) => (
              <li key={s.id} className="sponsor-card sponsor-card--past-partner">
                <p className="kicker">{s.label}</p>
                <h3 className="sponsor-card__name">{s.url ? <a href={s.url}>{s.name}</a> : s.name}</h3>
                {s.description && <p>{s.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2>What your support builds</h2>
      <ul className="cards cards--compact">
        {SUPPORT_BUILDS.map(([title, text]) => (
          <li key={title} className="card">
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ul>

      <h2>Partner with us</h2>
      <p>
        Companies, alumni, and recruiters: we’d love to talk about supporting the team, mentoring students, or recruiting
        from Bearospace.
      </p>
      <div className="cta-row">
        <a className="button button--gold" href={mailto('sponsorship')}>
          Email us about sponsorship
        </a>
        <a className="button" href={links.linkedin}>
          Bearospace on LinkedIn
        </a>
      </div>
      <p className="note">
        Or write to us at <a href={`mailto:${links.email}`}>{links.email}</a>.
      </p>
      <p className="note">
        See the <Link to="/engineering">engineering</Link>, <Link to="/projects">projects</Link>, and{' '}
        <Link to="/competitions">competition results</Link> your support makes possible.
      </p>
    </PageFrame>
  )
}
