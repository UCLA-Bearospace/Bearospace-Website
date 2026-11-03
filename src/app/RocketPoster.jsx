import meta from '../generated/rocket.meta.json'

// Static stand-in for the 3D scene (loading, reduced capability, failures): the real
// rocket's outline, drawn from the build-time profile, over a CSS starfield.

const L = meta.lengthM
const R = meta.bodyDiameterM / 2
// Seen from the 3D camera, the X-arranged fins project to about 0.7 of their span
const FIN = (meta.finSpanM / 2 - R) * 0.71
const PAD = 0.05
const W = (R + FIN + PAD) * 2
const H = L + PAD * 2

// y in the SVG grows downward: nose at the top
const y = (h) => PAD + (L - h)
const side = meta.profile.map(([r, h]) => `${(r).toFixed(4)},${y(h).toFixed(4)}`)
const outlinePath =
  `M${side.join(' L')} ` +
  meta.profile
    .slice()
    .reverse()
    .map(([r, h]) => `L${(-r).toFixed(4)},${y(h).toFixed(4)}`)
    .join(' ') +
  ' Z'
const noseY = y(L - meta.noseLengthM)
const fin = (dir) =>
  `M${dir * R},${y(meta.fin.rootToM)} L${dir * (R + FIN)},${y(meta.fin.tipToM)} ` +
  `L${dir * (R + FIN)},${y(meta.fin.tipFromM)} L${dir * R},${y(meta.fin.rootFromM)} Z`

export default function RocketPoster({ hidden }) {
  return (
    <div className="poster" data-hidden={hidden || undefined} aria-hidden="true">
      <svg className="poster-rocket" viewBox={`${-W / 2} 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id="poster-nose">
            <rect x={-W} y="0" width={W * 2} height={noseY} />
          </clipPath>
        </defs>
        <g className="poster-ink" strokeWidth="0.012" strokeLinejoin="round">
          <path className="poster-fin" d={fin(-1)} />
          <path className="poster-fin" d={fin(1)} />
          <path className="poster-body" d={outlinePath} />
          <path className="poster-nose" d={outlinePath} clipPath="url(#poster-nose)" />
        </g>
      </svg>
    </div>
  )
}
