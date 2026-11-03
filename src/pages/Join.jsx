import { useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router'
import PageFrame from '../components/PageFrame'
import { contactTopics, disciplines, getDiscipline, links, mailto, org } from '../content/index.js'

// ?interest=<discipline> (from discipline pages) preselects the membership email subject.
// Read after hydration so the prerendered HTML (which has no query) still matches.
const noop = () => () => {}
function useInterest() {
  useLocation() // re-render on navigation
  const slug = useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).get('interest'),
    () => null,
  )
  return getDiscipline(slug ?? '')
}

export default function Join() {
  const interest = useInterest()
  return (
    <PageFrame
      kicker="Join & contact"
      title="Join the crew"
      lede="Bearospace is open to students from all backgrounds and experience levels — whether you’ve built rockets before or never opened a CAD program."
    >
      <h2>Where you could contribute</h2>
      <ul className="inline-list inline-list--wrap">
        {disciplines.map((d) => (
          <li key={d.slug}>
            <Link to={`/engineering/${d.slug}`}>{d.name}</Link>
          </li>
        ))}
      </ul>

      <h2>Your next step</h2>
      {links.joinForm ? (
        <p>
          <a className="button button--gold" href={links.joinForm}>
            Fill out the interest form
          </a>
        </p>
      ) : (
        <>
          <p>
            Email the team and tell us what interests you{interest ? ` — we’ll point you to ${interest.name}` : ''}. We’ll
            let you know when and where to show up.
          </p>
          <p>
            <a className="button button--gold" href={mailto('membership', interest?.name)}>
              Email us about joining{interest ? ` ${interest.name}` : ''}
            </a>
          </p>
        </>
      )}
      {links.meetings && <p>{links.meetings}</p>}

      <h2>Find us</h2>
      <p>
        {org.location.building}, Room {org.location.room}, {org.location.campus}.{' '}
        {!org.location.verifiedAt && 'Email us before stopping by to make sure someone is there.'}
      </p>
      <p>
        <a href="https://www.google.com/maps/search/?api=1&query=Boelter+Hall+UCLA">Boelter Hall on Google Maps</a>
      </p>

      <h2>Contact</h2>
      <ul className="contact-buttons">
        {contactTopics.map((t) => (
          <li key={t.id}>
            <a className="button" href={mailto(t.id)}>
              {t.label}
            </a>
          </li>
        ))}
      </ul>
      <p>
        <a href={`mailto:${links.email}`}>{links.email}</a> · <a href={links.instagram}>Instagram</a> ·{' '}
        <a href={links.linkedin}>LinkedIn</a>
      </p>
    </PageFrame>
  )
}
