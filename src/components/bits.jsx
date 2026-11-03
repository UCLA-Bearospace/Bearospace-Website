import { Link } from 'react-router'
import Img from './Img'
import { sponsorList } from '../content/index.js'

const isUrl = (s) => /^https?:\/\//.test(s ?? '')

/** "Sources" footnote list for a page or section. Non-URL sources are shown as text. */
export function Sources({ items }) {
  const list = [...new Map(items.filter(Boolean).map((s) => [typeof s === 'string' ? s : s.url ?? s.label, s])).values()]
  if (!list.length) return null
  return (
    <aside className="sources" aria-label="Sources">
      <h2 className="sources__title">Sources</h2>
      <ul>
        {list.map((s) => {
          const label = typeof s === 'string' ? s : s.label
          const url = typeof s === 'string' ? s : s.url
          return <li key={label}>{isUrl(url) ? <a href={url}>{typeof s === 'string' ? hostOf(url) : label}</a> : label}</li>
        })}
      </ul>
    </aside>
  )
}

function hostOf(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '')
  } catch {
    return url
  }
}

const STATUS = {
  proposed: 'Proposed',
  'in-progress': 'In progress',
  'ground-tested': 'Ground-tested',
  flown: 'Flown',
  completed: 'Completed',
}

export function StatusBadge({ status }) {
  if (!status) return null
  return <span className={`status status--${status}`}>{STATUS[status]}</span>
}

/** Logo for a sponsor record, on the right background. */
export function SponsorLogo({ sponsor, height = 40 }) {
  const logo = sponsor.logo
  if (!logo) return <span className="sponsor-name">{sponsor.name}</span>
  if (logo.onDark) {
    return (
      <span className={`sponsor-logo${logo.invertOnDark ? ' sponsor-logo--invert' : ''}`}>
        <Img src={logo.onDark} alt={sponsor.name} style={{ height }} />
      </span>
    )
  }
  return (
    <span className="sponsor-logo sponsor-logo--plate">
      <Img src={logo.onLight} alt={sponsor.name} sizes="320px" style={{ height, width: 'auto' }} />
    </span>
  )
}

export function SponsorStrip() {
  const list = sponsorList().filter((s) => s.logo)
  return (
    <div className="sponsor-strip">
      <p className="kicker">Supported by</p>
      <ul>
        {list.map((s) => (
          <li key={s.id}>
            <Link to="/sponsors" aria-label={`${s.name} — ${s.label}`}>
              <SponsorLogo sponsor={s} height={28} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
