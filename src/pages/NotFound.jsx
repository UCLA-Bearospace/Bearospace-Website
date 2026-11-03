import { Link } from 'react-router'
import PageFrame from '../components/PageFrame'
import { destinations } from '../site/destinations.js'

export default function NotFound() {
  return (
    <PageFrame kicker="404" title="Lost signal." lede="We couldn’t find that page. Try one of these destinations instead.">
      <ul className="inline-list inline-list--wrap">
        <li>
          <Link to="/">Flight Deck</Link>
        </li>
        {destinations.map((d) => (
          <li key={d.id}>
            <Link to={d.path}>{d.label}</Link>
          </li>
        ))}
      </ul>
    </PageFrame>
  )
}
