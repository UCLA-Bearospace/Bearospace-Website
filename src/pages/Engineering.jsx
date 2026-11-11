import { useState, useSyncExternalStore } from 'react'
import { Link, useParams } from 'react-router'
import PageFrame from '../components/PageFrame'
import SystemMap from '../components/SystemMap'
import { useRocketHighlight } from '../components/useRocketHighlight'
import { OpenRoleCard, PersonCard } from '../components/people'
import {
  disciplinesInDivision,
  divisions,
  getDiscipline,
  getDivision,
  leadsFor,
  openRolesFor,
  org,
  projectsForDiscipline,
  seasonLabel,
  worksWithFor,
} from '../content/index.js'
import NotFound from './NotFound'

// The Engineering overview (/engineering) and the seven discipline pages. One module on
// purpose: both use the system map, and a module shared between two page chunks makes the
// bundler split React and the content out of the main script (slower first paint).

/** /engineering */
export default function Engineering() {
  // Rocket sections lit up on the map (and on the 3D rocket): from the legend or a card
  const [active, setActive] = useState([])
  useRocketHighlight(active)
  const show = (zoneIds) => () => setActive(zoneIds)
  const clear = () => setActive([])

  return (
    <PageFrame kicker="Engineering" title="One rocket, seven subteams">
      <SystemMap active={active} onHover={setActive} />

      {divisions.map((division) => (
        <section key={division.id} aria-labelledby={`division-${division.id}`}>
          <h2 id={`division-${division.id}`}>{division.name}</h2>
          <p>{division.summary}</p>
          <ul className="cards">
            {disciplinesInDivision(division.id).map((d) => {
              const shared = d.divisionIds.filter((id) => id !== division.id).map((id) => getDivision(id).name)
              return (
                <li
                  key={d.slug}
                  className="card card--link"
                  onMouseEnter={show(d.zones)}
                  onMouseLeave={clear}
                  onFocus={show(d.zones)}
                  onBlur={clear}
                >
                  <h3>
                    <Link to={`/engineering/${d.slug}`}>{d.name}</Link>
                  </h3>
                  <p>{d.summary}</p>
                  {shared.length > 0 && <p className="note">Shared with {shared.join(' and ')}</p>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

    </PageFrame>
  )
}

const List = ({ title, items, level: H = 'h2' }) =>
  items.length > 0 && (
    <>
      <H>{title}</H>
      <ul className="tick-list">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </>
  )

function Leads({ title, leads, open, level: H = 'h2' }) {
  return (
    <>
      <H>{title}</H>
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
    </>
  )
}

// false on the server and while hydrating, true after (the tabs need JavaScript)
const noop = () => () => {}
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
const useHash = () =>
  useSyncExternalStore(
    (on) => (window.addEventListener('hashchange', on), () => window.removeEventListener('hashchange', on)),
    () => window.location.hash.slice(1),
    () => '',
  )

/**
 * A subteam with two halves (Avionics & Recovery): one tab each, saying what that half does
 * and doesn't do, its work, skills, and leads. The address follows the tab
 * (/engineering/avionics-recovery#recovery), so a link can open either half. Without
 * JavaScript, and before hydration, both halves show one after the other.
 */
function Parts({ parts, leads, open }) {
  const hydrated = useHydrated()
  const hash = useHash()
  const [picked, setPicked] = useState(null)
  const active = picked ?? (parts.some((p) => p.id === hash) ? hash : parts[0].id)
  const season = seasonLabel(org.currentSeason)

  function pick(id) {
    setPicked(id)
    window.history.replaceState(window.history.state, '', `#${id}`) // no scroll, no new entry
    document.getElementById(`tab-${id}`)?.focus()
  }
  function onKeyDown(e, i) {
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: parts.length - 1 }[e.key]
    if (to === undefined) return
    e.preventDefault()
    pick(parts[(to + parts.length) % parts.length].id)
  }

  return (
    <div className="parts">
      {hydrated && (
        <div className="filters" role="tablist" aria-label="Parts of this subteam">
          {parts.map((p, i) => (
            <button
              key={p.id}
              id={`tab-${p.id}`}
              type="button"
              role="tab"
              className="filter"
              aria-selected={p.id === active}
              aria-controls={p.id}
              tabIndex={p.id === active ? 0 : -1}
              onClick={() => pick(p.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      {parts.map((p) => (
        <section
          key={p.id}
          id={p.id}
          role={hydrated ? 'tabpanel' : undefined}
          aria-labelledby={hydrated ? `tab-${p.id}` : `part-${p.id}`}
          hidden={hydrated && p.id !== active}
        >
          <h2 id={`part-${p.id}`} className={hydrated ? 'sr-only' : undefined}>
            {p.name}
          </h2>
          <p>{p.summary}</p>
          <List title={`What ${p.name} does`} items={p.does} level="h3" />
          <List title={`Not part of ${p.name}`} items={p.doesNot} level="h3" />
          <List title="What you'll work on" items={p.work} level="h3" />
          <List title="Skills you'll build" items={p.skills} level="h3" />
          <Leads
            title={`Who leads ${p.name} in ${season}`}
            leads={leads.filter(({ role }) => role.focus === p.id)}
            open={open.filter((r) => (r.focus ?? p.id) === p.id)}
            level="h3"
          />
        </section>
      ))}
    </div>
  )
}

/** /engineering/:discipline. Same module as the overview, so the two share one chunk. */
export function Discipline() {
  const { discipline: slug } = useParams()
  const d = getDiscipline(slug)
  useRocketHighlight(d?.zones ?? [])
  if (!d) return <NotFound />
  const leads = leadsFor(slug)
  const open = openRolesFor(slug)
  const projects = projectsForDiscipline(slug)
  const divisionNames = d.divisionIds.map((id) => getDivision(id).name)
  const partners = worksWithFor(slug)

  return (
    <PageFrame kicker={`${divisionNames.join(' × ')} division${divisionNames.length > 1 ? 's' : ''}`} title={d.name} lede={d.lede}>
      {d.divisionIds.length > 1 && (
        <p className="note">
          {d.name} is shared between the {divisionNames.join(' and ')} divisions — one team, working across both.
        </p>
      )}
      <List title="What we're responsible for" items={d.responsibilities} />

      <h2>Where it lives on the rocket</h2>
      {/* No caption: the heading above already says what the map shows */}
      <SystemMap id={`map-${slug}`} title={null} label={`${d.name} on the rocket`} active={d.zones} only={d.zones} />

      {d.parts ? (
        <Parts parts={d.parts} leads={leads} open={open} />
      ) : (
        <>
          <List title="What you'll work on" items={d.work} />
          <List title="Tools and methods" items={d.tools} />
          <List title="Skills you'll build" items={d.skills} />
          <Leads title={`Who leads it in ${seasonLabel(org.currentSeason)}`} leads={leads} open={open} />
        </>
      )}

      {partners.length > 0 && (
        <>
          <h2>Works closely with</h2>
          <ul>
            {partners.map((w) => (
              <li key={w.team}>
                {w.team}
                {w.person && (
                  <>
                    , led by{' '}
                    {w.person.consent ? <Link to={`/team/${w.person.slug}`}>{w.person.name}</Link> : w.person.name} ({w.role.title})
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
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

    </PageFrame>
  )
}
