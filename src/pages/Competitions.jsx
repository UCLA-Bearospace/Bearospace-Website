import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import PageFrame from '../components/PageFrame'
import { Sources } from '../components/bits'
import { competitions, getCompetition, getProject, publishedResults, seasonLabel } from '../content/index.js'
import { ordinal } from '../lib/format'
import { readStore, writeStore } from '../lib/storage'
import { isLandingLocation } from '../app/landing'

// The log types itself in, row by row, the first time a visitor arrives here by navigation
// in a session. Never on the landing page (first paint stays instant) or with reduced motion.
const LOG_SEEN = 'bearo:log-seen'

const AWARD = { overall: 'Overall', flight: 'Flight', report: 'Report award', design: 'Design', participation: 'Participant' }

export default function Competitions() {
  const results = publishedResults().sort((a, b) => b.season.localeCompare(a.season))
  const { key } = useLocation()
  const [typing] = useState(() => !isLandingLocation(key) && readStore(LOG_SEEN, null, 'session') === null)
  useEffect(() => {
    if (typing) writeStore(LOG_SEEN, '1', 'session')
  }, [typing])
  return (
    <PageFrame
      kicker="Competitions"
      title="Mission log"
      lede="Where we compete, what each competition asks of a team, and every result we can document — with its exact category and source."
    >
      {competitions.map((c) => (
        <section key={c.slug} id={c.slug} aria-labelledby={`${c.slug}-title`}>
          <h2 id={`${c.slug}-title`}>{c.name}</h2>
          <p className="note">Run by {c.organizer}</p>
          {c.summary.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>
            <a href={c.url}>About {c.name}</a>
          </p>
        </section>
      ))}

      <h2>Results</h2>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Competition results">
        <table className={typing ? 'log log--type' : 'log'}>
          <thead>
            <tr>
              <th scope="col">Season</th>
              <th scope="col">Competition</th>
              <th scope="col">Category</th>
              <th scope="col">Result</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const project = r.projectSlug && getProject(r.projectSlug)
              const competition = getCompetition(r.competitionSlug).name
              // Characters to type: 20 ms each, at most 0.6 s per row (CSS)
              const chars = `${seasonLabel(r.season)}${competition}${r.category}${ordinal(r.placement)}`.length
              return (
                <tr key={`${r.season}-${r.category}`} style={{ '--row': i, '--chars': chars }}>
                  <td data-label="Season">{seasonLabel(r.season)}</td>
                  <td data-label="Competition">{competition}</td>
                  <td data-label="Category">
                    {/* One wrapper: on phones each cell is a two-column label/value grid */}
                    <span>
                      {r.category}
                      {r.awardType === 'report' && <span className="tag">Report award</span>}
                      {r.awardType === 'flight' && <span className="tag">Flight award</span>}
                      {project && (
                        <>
                          {' · '}
                          <Link to={`/projects/${project.slug}`}>Project</Link>
                        </>
                      )}
                    </span>
                  </td>
                  <td data-label="Result">
                    {ordinal(r.placement)}
                    <span className="sr-only"> ({AWARD[r.awardType]})</span>
                  </td>
                  <td data-label="Source">
                    <a href={r.sourceUrl}>
                      Source<span className="sr-only">: {r.category}, {seasonLabel(r.season)}</span>
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="note">
        Results are listed as UCLA in the organizer’s records. Earlier and unconfirmed results are kept out of this log
        until they are verified.
      </p>

      <Sources items={competitions.map((c) => c.source)} />
    </PageFrame>
  )
}
