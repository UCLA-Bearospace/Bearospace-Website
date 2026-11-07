import { Link } from 'react-router'
import Img from './Img'
import { hasMedia } from './media'

const initials = (name) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

/** Headshot, or initials when there is no photo yet. */
export function Portrait({ person, sizes = '160px', eager = false }) {
  if (hasMedia(person.headshot)) {
    return <Img className="portrait" src={person.headshot} alt="" sizes={sizes} eager={eager} />
  }
  return (
    <span className="portrait portrait--initials" aria-hidden="true">
      {initials(person.name)}
    </span>
  )
}

/**
 * A person with their role; links to the profile when they have one. `eager` for portraits
 * visible on load (they are often the page's largest paint). `index` orders the reveal
 * when the page arrives by navigation (cards light up in role order).
 */
export function PersonCard({ person, role, eager = false, index = 0 }) {
  const name = person.consent ? <Link to={`/team/${person.slug}`}>{person.name}</Link> : person.name
  return (
    <li className="person-card" style={{ '--i': index }}>
      <Portrait person={person} eager={eager} />
      <span className="person-card__text">
        <strong className="person-card__name">{name}</strong>
        {role && <span className="person-card__role">{role.title}</span>}
      </span>
    </li>
  )
}

export function OpenRoleCard({ role, index = 0 }) {
  return (
    <li className="person-card person-card--open" style={{ '--i': index }}>
      <span className="portrait portrait--initials" aria-hidden="true">
        ?
      </span>
      <span className="person-card__text">
        <strong className="person-card__name">{role.title}</strong>
        <span className="person-card__role">
          Open position · <Link to={role.disciplineSlug ? `/join?interest=${role.disciplineSlug}` : '/join'}>Get involved</Link>
        </span>
      </span>
    </li>
  )
}
