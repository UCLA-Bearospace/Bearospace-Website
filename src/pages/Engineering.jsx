import { Link } from 'react-router'
import PageFrame from '../components/PageFrame'
import { Sources } from '../components/bits'
import { SOURCES, disciplines, disciplinesInDivision, divisions, getDivision, software } from '../content/index.js'

export default function Engineering() {
  return (
    <PageFrame kicker="Engineering" title="One rocket, seven disciplines" lede="Four divisions build every part of the vehicle and its payload, from the nose cone to the launch checklist.">
      {divisions.map((division) => (
        <section key={division.id} aria-labelledby={`division-${division.id}`}>
          <h2 id={`division-${division.id}`}>{division.name}</h2>
          <p>{division.summary}</p>
          <ul className="cards">
            {disciplinesInDivision(division.id).map((d) => {
              const shared = d.divisionIds.filter((id) => id !== division.id).map((id) => getDivision(id).name)
              return (
                <li key={d.slug} className="card card--link">
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

      <section aria-labelledby="software">
        <h2 id="software">{software.title}</h2>
        {software.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <ul className="inline-list">
          {software.links.map((slug) => (
            <li key={slug}>
              <Link to={`/engineering/${slug}`}>{disciplines.find((d) => d.slug === slug).name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <Sources items={[SOURCES.sitePrograms]} />
    </PageFrame>
  )
}
