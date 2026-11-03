import { Link, useParams } from 'react-router'
import PageFrame from '../components/PageFrame'
import { Sources } from '../components/bits'
import { OpenRoleCard, PersonCard, Portrait } from '../components/people'
import {
  contributionsBy,
  getDiscipline,
  getProfile,
  org,
  roster,
  rosterSeasons,
  rolesFor,
  seasonLabel,
} from '../content/index.js'
import NotFound from './NotFound'

function SeasonNav({ current }) {
  return (
    <nav aria-label="Seasons" className="season-jump">
      <ul className="inline-list">
        {rosterSeasons().map((s) => (
          <li key={s}>
            {s === current ? (
              <span aria-current="page">{seasonLabel(s)}</span>
            ) : (
              <Link to={s === org.currentSeason ? '/team' : `/team/season/${s}`}>{seasonLabel(s)}</Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Roster({ season }) {
  const groups = roster(season)
  const sources = [...new Set(groups.flatMap((g) => g.members.map((m) => m.role.source)))]
  return (
    <>
      <SeasonNav current={season} />
      {groups.map(({ group, members, open }, g) => (
        <section key={group.id} aria-labelledby={`group-${group.id}`}>
          <h2 id={`group-${group.id}`}>{group.label}</h2>
          <ul className="people-grid">
            {members.map(({ role, person }) => (
              <PersonCard key={`${role.personSlug}-${role.title}`} person={person} role={role} eager={g === 0} />
            ))}
            {open.map((r) => (
              <OpenRoleCard key={r.title} role={r} />
            ))}
          </ul>
        </section>
      ))}
      <Sources items={sources} />
    </>
  )
}

export function Team() {
  return (
    <PageFrame
      kicker="Team"
      title={`${seasonLabel(org.currentSeason)} leadership`}
      lede="The students leading Bearospace this season, by division. Every member page stays at the same address after people graduate."
    >
      <Roster season={org.currentSeason} />
    </PageFrame>
  )
}

export function TeamSeason() {
  const { season } = useParams()
  if (!rosterSeasons().includes(season)) return <NotFound />
  return (
    <PageFrame kicker="Team" title={`The ${seasonLabel(season)} team`} lede="Roles as published that season.">
      <Roster season={season} />
    </PageFrame>
  )
}

export function Member() {
  const { person: slug } = useParams()
  const person = getProfile(slug)
  if (!person) return <NotFound />
  const history = rolesFor(slug)
  const current = history.find((r) => r.season === org.currentSeason)
  const latest = history[0]
  const contributions = contributionsBy(slug)
  const disciplines = [...new Set(history.flatMap((r) => [r.disciplineSlug, ...(r.also ?? [])]).filter(Boolean))]
  const links = Object.entries(person.links ?? {})

  return (
    <PageFrame
      kicker={current ? `${current.title} · ${seasonLabel(current.season)}` : latest ? `Alumni · ${seasonLabel(latest.season)}` : 'Team'}
      title={person.name}
    >
      <div className="profile">
        <Portrait person={person} sizes="240px" eager />
        <div>
          <h2>Roles</h2>
          <ul>
            {history.map((r) => (
              <li key={`${r.season}-${r.title}`}>
                {r.title}, {seasonLabel(r.season)}
              </li>
            ))}
          </ul>

          {disciplines.length > 0 && (
            <>
              <h2>Disciplines</h2>
              <ul className="inline-list">
                {disciplines.map((s) => (
                  <li key={s}>
                    <Link to={`/engineering/${s}`}>{getDiscipline(s).name}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {contributions.length > 0 && (
            <>
              <h2>Contributions</h2>
              <ul>
                {contributions.map(({ project, contribution }) => (
                  <li key={project.slug}>
                    <Link to={`/projects/${project.slug}`}>{project.title}</Link> ({seasonLabel(project.season)}):{' '}
                    {contribution}
                  </li>
                ))}
              </ul>
            </>
          )}

          {links.length > 0 && (
            <>
              <h2>Elsewhere</h2>
              <ul className="inline-list">
                {links.map(([kind, url]) => (
                  <li key={kind}>
                    <a href={url}>{{ linkedin: 'LinkedIn', github: 'GitHub', site: 'Website' }[kind]}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <p>
        <Link to="/team">Back to the team</Link>
      </p>
      <Sources items={[person.source, ...history.map((r) => r.source)]} />
    </PageFrame>
  )
}

export default Team
