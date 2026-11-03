import { useEffect, useState } from 'react'
import FlightBackdrop from '../app/FlightBackdrop'
import './lab.css'

// Dev-only tuning panel for the rocket prototype (/lab/rocket). Never shipped:
// main.jsx only imports it when import.meta.env.DEV is true.

const SLIDERS = [
  ['speed', 'Flight speed', 0, 3, 0.05],
  ['thrust', 'Thrust', 0, 1.5, 0.05],
  ['vacuum', 'Vacuum (plume)', 0, 1, 0.05],
  ['spin', 'Roll rate (rad/s)', 0, 1, 0.01],
  ['lean', 'Lean (deg)', -15, 15, 0.5],
  ['sway', 'Camera breathing', 0, 2, 0.05],
  ['lines', 'Speed lines', 0, 1, 0.05],
  ['rim', 'Rim light', 0, 2, 0.05],
  ['inkStrength', 'Ink strength', 0, 1, 0.05],
  ['cam.dist', 'Camera distance', 4, 16, 0.1],
  ['cam.yaw', 'Camera yaw (deg)', -90, 90, 1],
  ['cam.height', 'Camera height', -2, 4, 0.05],
  ['cam.lookY', 'Look-at height', 0, 2.6, 0.02],
  ['cam.fov', 'Field of view', 15, 60, 0.5],
]

const get = (o, path) => path.split('.').reduce((v, k) => v[k], o)
function set(o, path, value) {
  const keys = path.split('.')
  const last = keys.pop()
  keys.reduce((v, k) => v[k], o)[last] = value
}

export default function RocketLab() {
  const [engine, setEngine] = useState(null)
  const [values, setValues] = useState({})
  const [stats, setStats] = useState(null)
  const [ink, setInk] = useState('light')

  useEffect(() => {
    if (!engine) return
    const id = setInterval(() => setStats(engine.stats()), 500)
    return () => clearInterval(id)
  }, [engine])

  function attach(next) {
    setEngine(next)
    if (next) setValues(Object.fromEntries(SLIDERS.map(([k]) => [k, get(next.state, k)])))
  }

  function change(key, value) {
    set(engine.state, key, value)
    setValues((v) => ({ ...v, [key]: value }))
  }

  return (
    <>
      <FlightBackdrop motion onEngine={attach} />
      <aside className="lab" data-lab>
        <h1>Rocket lab</h1>
        {stats && (
          <p className="lab-stats">
            {stats.fps.toFixed(0)} fps · p95 {stats.p95.toFixed(1)} ms · tier {stats.tier} · dpr {stats.dpr} ·{' '}
            {engine.model}
          </p>
        )}
        {engine &&
          SLIDERS.map(([key, label, min, max, step]) => (
            <label key={key}>
              <span>
                {label} <output>{values[key]}</output>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={values[key] ?? min}
                onChange={(e) => change(key, Number(e.target.value))}
              />
            </label>
          ))}
        {engine && (
          <>
            <label>
              <span>Ink</span>
              <select
                value={ink}
                onChange={(e) => {
                  setInk(e.target.value)
                  engine.setInk(e.target.value)
                }}
              >
                <option value="light">Light (space)</option>
                <option value="dark">Dark (ground)</option>
              </select>
            </label>
            <label>
              <span>Quality tier</span>
              <select defaultValue={engine.tier} onChange={(e) => engine.setTier(Number(e.target.value))}>
                {[0, 1, 2, 3, 4].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </aside>
    </>
  )
}
