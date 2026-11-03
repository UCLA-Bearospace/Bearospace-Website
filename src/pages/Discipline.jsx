import { Link, useParams } from 'react-router'
import PageFrame from '../components/PageFrame'
import { Sources } from '../components/bits'
import { OpenRoleCard, PersonCard } from '../components/people'
import { getDiscipline, getDivision, leadsFor, openRolesFor, projectsForDiscipline, seasonLabel, org } from '../content/index.js'
import NotFound from './NotFound'

const List = ({ title, items }) =>
  items.length > 0 && (
    <>
      <h2>{title}</h2>
      <ul className="tick-list">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </>
  )

export default function Discipline() {
  const { discipline: slug } = useParams()
  const d = getDiscipline(slug)
  if (!d) return <NotFound />
  const leads = leadsFor(slug)
  const open = openRolesFor(slug)
  const projects = projectsForDiscipline(slug)
  const divisionNames = d.divisionIds.map((id) => getDivision(id).name)

  return (
    <PageFrame kicker={`${divisionNames.join(' × ')} division${divisionNames.length > 1 ? 's' : ''}`} title={d.name} lede={d.lede}>
      {d.divisionIds.length > 1 && (
        <p className="note">
          {d.name} is shared between the {divisionNames.join(' and ')} divisions — one team, working across both.
        </p>
      )}
      <List title="What we're responsible for" items={d.responsibilities} />
      <List title="What you'll work on" items={d.work} />
      <List title="Tools and methods" items={d.tools} />
      <List title="Skills you'll build" items={d.skills} />

      <h2>Who leads it in {seasonLabel(org.currentSeason)}</h2>
      {leads.length || open.length ? (
        <ul className="people-grid">
          {leads.map(({ role, person }) => (
            <PersonCard key={role.personSlug} person={person} role={role} />
          ))}
          {open.map((r) => (
            <OpenRoleCard key={r.title} role={r} />
          ))}
        </ul>
      ) : (
        <p>
          No lead is listed for this season yet. <Link to="/join">Ask us how to get involved.</Link>
        </p>
      )}

      {projects.length > 0 && (
        <>
          <h2>Related projects</h2>
          <ul>
            {projects.map((p) => (
              <li key={p.slug}>
                <Link to={`/projects/${p.slug}`}>{p.title}</Link> ({seasonLabel(p.season)})
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="cta-band">
        <p>Interested in {d.name.toLowerCase()}?</p>
        <Link className="button button--gold" to={`/join?interest=${d.slug}`}>
          Get involved
        </Link>
      </div>

      <Sources items={[d.source]} />
    </PageFrame>
  )
}
