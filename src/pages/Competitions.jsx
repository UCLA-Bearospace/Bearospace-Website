import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import PageFrame from '../components/PageFrame'
import { Img, Sources } from '../components/bits'
import { competitions, getCompetition, getProject, publishedResults, seasonLabel } from '../content/index.js'
import { ordinal } from '../lib/format'
import { readStore, writeStore } from '../lib/storage'
import { isLandingLocation } from '../app/landing'
import { stageOf } from '../content/competitionTimeline.js'

// The log types itself in, row by row, the first time a visitor arrives here by navigation
// in a session. Never on the landing page (first paint stays instant) or with reduced motion.
const LOG_SEEN = 'bearo:log-seen'

const AWARD = { overall: 'Overall', flight: 'Flight', report: 'Report award', design: 'Design', participation: 'Participant' }

const list = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0])

/**
 * One competition as a dropdown, like History's seasons. Closed, it shows the logo, the name,
 * and this season's stage with a thin progress line; open, a stage tracker (every stage with
 * its dates, done / now / next), what the current stage involves, and the competition itself.
 * A link to /competitions#<slug> opens it.
 */
function Competition({ c }) {
  const t = stageOf(c.slug)
  return (
    <details id={c.slug} className="season competition">
      <summary onClick={(e) => (e.currentTarget.parentElement.dataset.toggled = '')}>
        <span className="competition__head">
          {/* Decorative: the name is right beside it */}
          {c.logo && (
            <Img
              className={c.logo.tile ? 'competition__logo competition__logo--tile' : 'competition__logo'}
              src={c.logo.src}
              alt=""
              sizes="80px"
            />
          )}
          <span className="competition__title">
            <h2>{c.name}</h2>
            {t && (
              <span className="competition__stage">
                {seasonLabel(t.season)} · Now: <strong>{t.stage.name}</strong>
                <span className="sr-only">
                  {' '}
                  (stage {t.index + 1} of {t.stages.length})
                </span>
              </span>
            )}
          </span>
        </span>
        {t && (
          <span className="tracker-mini" aria-hidden="true">
            <span style={{ width: `${((t.index + 0.5) / t.stages.length) * 100}%` }} />
          </span>
        )}
      </summary>

      {t && (
        <>
          <h3 className="sr-only">{seasonLabel(t.season)} progress</h3>
          <ol className="tracker" style={{ '--stages': t.stages.length }}>
            {t.stages.map((s, i) => (
              <li
                key={s.id}
                className={i < t.index ? 'is-done' : i === t.index ? 'is-now' : undefined}
                aria-current={i === t.index ? 'step' : undefined}
              >
                <span className="tracker__name">
                  {s.short}
                  {i < t.index && <span className="sr-only"> (done)</span>}
                </span>
                <span className="tracker__date">{s.date}</span>
              </li>
            ))}
          </ol>
          <div className="tracker__now">
            <p className="kicker">
              Now · stage {t.index + 1} of {t.stages.length}
            </p>
            <h3>{t.stage.name}</h3>
            <p>{t.stage.about}</p>
            <p className="note">
              Dates from the <a href={t.source.url}>{t.source.label}</a>, subject to change. Updated {t.asOf}.
            </p>
          </div>
        </>
      )}

      <h3>About {c.name}</h3>
      <p className="note">Run by {c.organizer}</p>
      {c.summary.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <p>
        <a href={c.url}>{c.name} on the organizer’s site</a>
      </p>
    </details>
  )
}

export default function Competitions() {
  const logos = competitions.filter((c) => c.logo).map((c) => c.logo)
  const results = publishedResults().sort((a, b) => b.season.localeCompare(a.season))
  const { key, hash } = useLocation()
  const [typing] = useState(() => !isLandingLocation(key) && readStore(LOG_SEEN, null, 'session') === null)
  useEffect(() => {
    if (typing) writeStore(LOG_SEEN, '1', 'session')
  }, [typing])
  // A link to /competitions#<slug> opens that competition's dropdown
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (el?.tagName === 'DETAILS') el.setAttribute('open', '')
  }, [hash])
  return (
    <PageFrame
      kicker="Competitions"
      title="Mission log"
      lede="Where we compete, what each competition asks of a team, and every result we can document — with its exact category and source."
    >
      {competitions.map((c) => (
        <Competition key={c.slug} c={c} />
      ))}

      {logos.length > 0 && (
        <p className="note">
          {logos.length > 1 ? (
            <>
              The {list(logos.map((l) => l.name))} are trademarks of {list(logos.map((l) => l.owner))}. They appear here
              for identification and for informational and historical purposes only, to show the competitions Bearospace
              has entered. Their use does not imply endorsement by, or affiliation with, either organization.
            </>
          ) : (
            <>
              The {logos[0].name} is a trademark of {logos[0].owner}. It appears here for identification and for
              informational and historical purposes only, to show a competition Bearospace has entered. Its use does not
              imply endorsement by, or affiliation with, that organization.
            </>
          )}
        </p>
      )}

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
