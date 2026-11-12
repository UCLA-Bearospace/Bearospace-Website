import { Link } from 'react-router'
import { disciplinesInZone, zones } from '../content/index.js'
import SystemMapDrawing from './SystemMapDrawing'

// The Engineering system map (docs/PLAN.md §8.3): the rocket divided into sections, each
// with the disciplines that work on it. The numbered legend is the real content (links,
// works without JavaScript); the to-scale picture above it is decorative (aria-hidden).
// Hovering or focusing a legend entry calls `onHover` with that section.

const numbered = zones.map((z, i) => ({ ...z, n: i + 1 }))

/** `title` is the visible caption; with `title={null}`, `label` names the figure for screen readers only. */
export default function SystemMap({ active = [], onHover, only, id = 'system-map', title = 'The rocket, section by section', label }) {
  'use no memo' // a short list that re-renders on hover: memoizing it would cost more bytes than time
  const legend = only ? numbered.filter((z) => only.includes(z.id)) : numbered
  const hover = (ids) => onHover && (() => onHover(ids))
  const leave = onHover && (() => onHover([]))

  return (
    <figure
      className="system-map"
      data-active={active.length > 0 || undefined}
      aria-labelledby={title ? `${id}-title` : undefined}
      aria-label={title ? undefined : label}
    >
      {title && (
        <figcaption id={`${id}-title`} className="system-map__title">
          {title}
        </figcaption>
      )}
      <div className="system-map__frame">
        <SystemMapDrawing id={id} active={active} />
      </div>

      <ol className="system-map__legend">
        {legend.map((z) => (
          <li
            key={z.id}
            value={z.n}
            className={active.includes(z.id) ? 'is-on' : undefined}
            onMouseEnter={hover([z.id])}
            onMouseLeave={leave}
            onFocus={hover([z.id])}
            onBlur={leave}
          >
            <span className="system-map__name">{z.label}</span>
            {z.approximate && <span className="system-map__approx"> (approximate position)</span>}
            {' — '}
            {disciplinesInZone(z.id).map((d, i) => (
              <span key={d.slug}>
                {i > 0 && ', '}
                <Link to={`/engineering/${d.slug}`}>{d.name}</Link>
              </span>
            ))}
          </li>
        ))}
      </ol>
      <p className="system-map__note">
        Drawn to scale from the 2025–26 rocket. Nose cone, airframe, and fins come from its 3D model; the internal sections show the
        usual layout of a dual-deploy rocket, not measured positions.
      </p>
    </figure>
  )
}
