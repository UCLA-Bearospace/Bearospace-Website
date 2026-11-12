import { zones } from '../content/index.js'
import { OUTLINE } from '../content/systemMap.js'

// The system map's picture: a side view of the 2025–26 rocket, drawn to scale from the
// model's measurements (OUTLINE, copied from rocket.meta.json) and divided into the
// sections in src/content/systemMap.js. Decorative: the legend in SystemMap carries the meaning.

const { lengthM, bodyDiameterM, finSpanM, fin, nose } = OUTLINE
const W = 1000 // the rocket's length in drawing units
const S = W / lengthM // drawing units per metre
const CY = 125 // the rocket's axis
const GROUND = 262
export const VIEWBOX = `-20 0 ${W + 40} 280`

const x = (fromNose) => fromNose * W // fraction of the length from the nose → x
const xTail = (metresFromTail) => (lengthM - metresFromTail) * S
const pt = (px, py) => `${px.toFixed(1)},${py.toFixed(1)}`

// Outline: the nose curve, then the airframe at full width to the tail
const R = (bodyDiameterM / 2) * S
const top = [...nose.map(([r, d]) => pt(d * S, CY - r * S)), pt(W, CY - R)]
const bottom = [...nose.map(([r, d]) => pt(d * S, CY + r * S)), pt(W, CY + R)].reverse()
const BODY = `M${top.join(' L')} L${bottom.join(' L')} Z`

// One fin above the body and one below, as a side view shows them
const TIP = (finSpanM / 2) * S
const finPoints = (sign) =>
  [
    pt(xTail(fin.rootToM), CY - sign * R),
    pt(xTail(fin.tipToM), CY - sign * TIP),
    pt(xTail(fin.tipFromM), CY - sign * TIP),
    pt(xTail(fin.rootFromM), CY - sign * R),
  ].join(' ')
const FINS = [finPoints(1), finPoints(-1)]

const NUMBERED = zones.map((z, i) => ({ ...z, n: i + 1 }))
const BODY_ZONES = NUMBERED.filter((z) => z.part === 'body')
const FIN_ZONE = NUMBERED.find((z) => z.part === 'fins') // fins plus the fin can on the body
const numberOf = (part) => NUMBERED.find((z) => z.part === part)?.n
// The fins' number sits just ahead of the top fin's leading edge, clear of the fin itself
const FIN_LABEL = {
  x: (xTail(fin.rootToM) + xTail(fin.tipToM)) / 2 - 38,
  y: (CY - R + CY - TIP) / 2 + 10,
}
// One number per section, over the middle of its whole length (a section can be several bays)
const middle = (z) => (x(z.segments[0][0]) + x(z.segments.at(-1)[1])) / 2

export default function SystemMapDrawing({ id, active }) {
  const cls = (zone, extra = '') => `zone zone--${zone}${extra}${active.includes(zone) ? ' is-on' : ''}`
  return (
    <svg className="system-map__drawing" viewBox={VIEWBOX} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}-body`}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <line className={cls('ground')} x1="-10" x2={W + 10} y1={GROUND} y2={GROUND} />
      {FINS.map((points) => (
        <polygon key={points} className={cls('fins')} points={points} />
      ))}
      <g clipPath={`url(#${id}-body)`}>
        <rect className="system-map__body" x="0" y={CY - 60} width={W} height="120" />
        {BODY_ZONES.flatMap((z) =>
          z.segments.map(([from, to]) => (
            <rect key={from} className={cls(z.id, z.approximate ? ' zone--approx' : '')} x={x(from)} y={CY - 60} width={x(to) - x(from)} height="120" />
          )),
        )}
        {FIN_ZONE?.segments.map(([from, to]) => (
          <rect key={from} className={cls('fins', ' zone--fincan')} x={x(from)} y={CY - 60} width={x(to) - x(from)} height="120" />
        ))}
      </g>
      <path className={cls('airframe')} d={BODY} />
      {/* Section numbers, matching the legend */}
      {BODY_ZONES.map((z) => (
        <text key={z.id} className="system-map__num" x={middle(z)} y={CY - R - 16}>
          {z.n}
        </text>
      ))}
      <text className="system-map__num" x={FIN_LABEL.x} y={FIN_LABEL.y}>
        {numberOf('fins')}
      </text>
      <text className="system-map__num" x={x(0.62)} y={CY + R + 38}>
        {numberOf('outline')}
      </text>
      <text className="system-map__num" x={24} y={GROUND - 12}>
        {numberOf('ground')}
      </text>
    </svg>
  )
}
