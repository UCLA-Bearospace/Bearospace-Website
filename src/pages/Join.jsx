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
      {links.discord && (
        <>
          <p>
            Join our Discord, then drop by {org.location.building} during one of our meetings or office hours
            {interest ? ` and ask about ${interest.name}` : ''}. Times are posted in the Discord’s announcements channel.
          </p>
          <p>
            <a className="button button--gold" href={links.discord}>
              Join the Bearospace Discord
            </a>
          </p>
        </>
      )}
      {links.joinForm && (
        <p>
          <a className="button" href={links.joinForm}>
            Fill out the interest form
          </a>
        </p>
      )}
      <p>
        {links.discord ? 'Prefer email? ' : ''}Tell us what interests you{interest ? ` — we’ll point you to ${interest.name}` : ''}.
      </p>
      <p>
        <a className={links.discord ? 'button' : 'button button--gold'} href={mailto('membership', interest?.name)}>
          Email us about joining{interest ? ` ${interest.name}` : ''}
        </a>
      </p>
      {links.meetings && <p>{links.meetings}</p>}

      <h2>Find us</h2>
      <p>
        {org.location.building}, Room {org.location.room}, {org.location.campus}.{' '}
        {links.discord
          ? 'Come by during a meeting or office-hour time announced on our Discord.'
          : 'Email us before stopping by to make sure someone is there.'}
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
        {links.discord && (
          <>
            {' · '}
            <a href={links.discord}>Discord</a>
          </>
        )}
      </p>
    </PageFrame>
  )
}
