import { Link } from 'react-router'
import PageFrame from '../components/PageFrame'
import { Sources } from '../components/bits'
import { competitions, getCompetition, getProject, publishedResults, seasonLabel } from '../content/index.js'
import { ordinal } from '../lib/format'

const AWARD = { overall: 'Overall', flight: 'Flight', report: 'Report award', design: 'Design', participation: 'Participant' }

export default function Competitions() {
  const results = publishedResults().sort((a, b) => b.season.localeCompare(a.season))
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
        <table className="log">
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
            {results.map((r) => {
              const project = r.projectSlug && getProject(r.projectSlug)
              return (
                <tr key={`${r.season}-${r.category}`}>
                  <td data-label="Season">{seasonLabel(r.season)}</td>
                  <td data-label="Competition">{getCompetition(r.competitionSlug).name}</td>
                  <td data-label="Category">
                    {r.category}
                    {r.awardType === 'report' && <span className="tag">Report award</span>}
                    {project && (
                      <>
                        {' · '}
                        <Link to={`/projects/${project.slug}`}>Project</Link>
                      </>
                    )}
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
