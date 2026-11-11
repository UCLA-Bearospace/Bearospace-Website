import { Link, useParams } from 'react-router'
import PageFrame from '../components/PageFrame'
import { SourceLink, Sources, StatusBadge } from '../components/bits'
import { Img } from '../components/bits'
import { getCompetition, getDiscipline, getPerson, getProject, publishedProjects, seasonLabel } from '../content/index.js'
import NotFound from './NotFound'

export function Projects() {
  const projects = publishedProjects().sort((a, b) => b.season.localeCompare(a.season))
  // Grouped by season, newest first. (Season and discipline filters can join once there
  // are enough projects to need them.)
  const seasons = [...new Set(projects.map((p) => p.season))]
  // Projects is for current designs and R&D (content review, 2026-11-10). Until the first
  // write-up is confirmed, a short "coming soon" page points to History, where earlier
  // seasons' rockets now live.
  if (!projects.length) {
    return (
      <PageFrame kicker="Projects" title="Coming soon" lede="Our current designs and R&D projects are coming soon.">
        <p>
          This is where we’ll show what we’re designing and testing now, from this season’s payload to our research projects.
        </p>
        <p>
          Earlier seasons’ rockets and results are on the <Link to="/history">History</Link> page.
        </p>
      </PageFrame>
    )
  }
  return (
    <PageFrame kicker="Projects" title="What we’re working on" lede="Our current designs and R&D projects.">
      {projects.length ? (
        seasons.map((season) => (
          <section key={season} aria-labelledby={`projects-${season}`}>
            <h2 id={`projects-${season}`}>{seasonLabel(season)}</h2>
            <ul className="cards">
              {projects
                .filter((p) => p.season === season)
                .map((p) => (
                  <li key={p.slug} className="card card--link">
                    <p className="kicker">
                      {p.competitionSlug ? getCompetition(p.competitionSlug).name : 'Project'} <StatusBadge status={p.status} />
                    </p>
                    <h3 className="card__title">
                      <Link to={`/projects/${p.slug}`}>{p.title}</Link>
                    </h3>
                    <p>{p.summary}</p>
                  </li>
                ))}
            </ul>
          </section>
        ))
      ) : (
        <p>Project write-ups are on their way.</p>
      )}
    </PageFrame>
  )
}

const Section = ({ title, items, ordered = false }) => {
  if (!items?.length) return null
  const L = ordered ? 'ol' : 'ul'
  return (
    <>
      <h2>{title}</h2>
      <L>
        {items.map((x) => (
          <li key={typeof x === 'string' ? x : x.text}>{typeof x === 'string' ? x : x.text}</li>
        ))}
      </L>
    </>
  )
}

export function Project() {
  const { slug } = useParams()
  const p = getProject(slug)
  if (!p) return <NotFound />
  const competition = p.competitionSlug && getCompetition(p.competitionSlug)

  return (
    <PageFrame
      kicker={
        <>
          {seasonLabel(p.season)} {competition && `· ${competition.name}`} <StatusBadge status={p.status} />
        </>
      }
      title={p.title}
      lede={p.summary}
    >
      {p.media.length > 0 && (
        <div className="media-row">
          {p.media.map((m) => (
            <Img key={m.src} src={m.src} alt={m.alt ?? ''} sizes="(min-width: 60rem) 30rem, 100vw" />
          ))}
        </div>
      )}
      <Section title="Objective" items={p.objective} />
      <Section title="Constraints" items={p.constraints} />
      <Section title="Approach" items={p.approach} />
      <Section title="Hardware" items={p.hardware} />
      <Section title="Software" items={p.software} />
      {p.testing.length > 0 && (
        <>
          <h2>Testing</h2>
          <ol className="test-log">
            {p.testing.map((t) => (
              <li key={t.text}>
                {t.date && <time dateTime={t.date}>{t.date}</time>} {t.text}
              </li>
            ))}
          </ol>
        </>
      )}
      {p.results.length > 0 && (
        <>
          <h2>Results</h2>
          <ul>
            {p.results.map((r) => (
              <li key={r.text}>
                {r.text} <SourceLink source={r.source} />
              </li>
            ))}
          </ul>
        </>
      )}
      <Section title="Lessons learned" items={p.lessons} />

      {p.contributors.length > 0 && (
        <>
          <h2>Contributors</h2>
          <dl className="contributors">
            {p.contributors.map((c) => {
              const person = getPerson(c.personSlug)
              return (
                <div key={c.personSlug}>
                  <dt>{person.consent ? <Link to={`/team/${person.slug}`}>{person.name}</Link> : person.name}</dt>
                  <dd>{c.contribution}</dd>
                </div>
              )
            })}
          </dl>
        </>
      )}

      {p.disciplineSlugs.length > 0 && (
        <>
          <h2>Disciplines involved</h2>
          <ul className="inline-list">
            {p.disciplineSlugs.map((s) => (
              <li key={s}>
                <Link to={`/engineering/${s}`}>{getDiscipline(s).name}</Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="note">Last verified {p.lastVerified}.</p>
      <Sources items={p.sources} />
    </PageFrame>
  )
}

export default Projects
