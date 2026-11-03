import { Link } from 'react-router'
import PageFrame from '../components/PageFrame'
import {
  getCompetition,
  getPerson,
  getProfile,
  org,
  publishedMilestones,
  publishedResults,
  publishedRoles,
  seasonLabel,
} from '../content/index.js'
import { ordinal } from '../lib/format'

/** Every season with something documented, newest first. */
function seasons() {
  const all = new Set([
    ...publishedMilestones().map((m) => m.season),
    ...publishedResults().map((r) => r.season),
    ...publishedRoles().map((r) => r.season),
  ])
  return [...all].sort().reverse()
}

export default function History() {
  const list = seasons()
  return (
    <PageFrame
      kicker="History"
      title="Season by season"
      lede="The documented story of rocketry at UCLA AISES: the teams, the rockets, and the results."
    >
      <nav aria-label="Seasons" className="season-jump">
        <ul className="inline-list">
          {list.map((s) => (
            <li key={s}>
              <a href={`#season-${s}`}>{seasonLabel(s)}</a>
            </li>
          ))}
        </ul>
      </nav>

      {list.map((season, i) => {
        const milestones = publishedMilestones().filter((m) => m.season === season)
        const results = publishedResults().filter((r) => r.season === season)
        const people = publishedRoles().filter((r) => r.season === season)
        return (
          <details key={season} id={`season-${season}`} className="season" open={i < 2}>
            <summary>
              <h2>{seasonLabel(season)}</h2>
            </summary>
            {milestones.map((m) => (
              <div key={m.title} className="milestone">
                <h3>{m.title}</h3>
                <p>
                  {m.body} <a href={m.source}>Source</a>
                </p>
                {m.projectSlug && (
                  <p>
                    <Link to={`/projects/${m.projectSlug}`}>Read the project</Link>
                  </p>
                )}
              </div>
            ))}
            {results.length > 0 && (
              <>
                <h3>Results</h3>
                <ul>
                  {results.map((r) => (
                    <li key={r.category}>
                      {ordinal(r.placement)}, {r.category} — {getCompetition(r.competitionSlug).name}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {people.length > 0 && (
              <>
                <h3>Team</h3>
                <p>
                  {people.map((r, k) => {
                    const p = getProfile(r.personSlug)
                    const name = p ? <Link to={`/team/${p.slug}`}>{p.name}</Link> : getPerson(r.personSlug).name
                    return (
                      <span key={`${r.personSlug}-${r.title}`}>
                        {k > 0 && '; '}
                        {name} ({r.title})
                      </span>
                    )
                  })}
                </p>
                {season !== org.currentSeason && (
                  <p>
                    <Link to={`/team/season/${season}`}>{seasonLabel(season)} team page</Link>
                  </p>
                )}
              </>
            )}
          </details>
        )
      })}

      <p className="note">
        No public record has been found yet for 2019–20 through 2022–23. Have photos or stories from those seasons?{' '}
        <Link to="/join">Tell us.</Link>
      </p>
    </PageFrame>
  )
}
