import { Link, useParams } from 'react-router'
import PageFrame from '../components/PageFrame'
import { Sources, StatusBadge } from '../components/bits'
import Img from '../components/Img'
import { getCompetition, getDiscipline, getPerson, getProject, publishedProjects, seasonLabel } from '../content/index.js'
import NotFound from './NotFound'

export function Projects() {
  const projects = publishedProjects().sort((a, b) => b.season.localeCompare(a.season))
  return (
    <PageFrame
      kicker="Projects"
      title="What we build"
      lede="Each project page covers the objective, the hardware and software, how it was tested, what happened, and who did what."
    >
      {projects.length ? (
        <ul className="cards">
          {projects.map((p) => (
            <li key={p.slug} className="card card--link">
              <p className="kicker">
                {seasonLabel(p.season)} <StatusBadge status={p.status} />
              </p>
              <h2 className="card__title">
                <Link to={`/projects/${p.slug}`}>{p.title}</Link>
              </h2>
              <p>{p.summary}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Project write-ups are on their way.</p>
      )}
      <p className="note">
        More project write-ups, including the current season’s rocket, will appear here as the team confirms their details.
      </p>
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
      <Section title="Testing" items={p.testing.map((t) => (t.date ? `${t.date}: ${t.text}` : t.text))} />
      <Section title="Results" items={p.results} />
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
