import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  BoxGeometry,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
} from 'three'
import { toon } from './toon'
import { createRocketMaterial } from './rocketMaterial'
import { buildPlaceholderGeometry } from './rocket'
import { BEAR_LINES, BEAR_STARS } from '../site/constellation.js'

// The eight Flight Deck destinations as small toon/ink celestial bodies. Each is built
// at unit radius and scaled to its slot size. Solid parts sit on layer 0 (ink outlines);
// glows and trails sit on layer 1.

let glowMap = null
function glow() {
  if (!glowMap) {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.3, 'rgba(255,255,255,0.45)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)
    glowMap = new CanvasTexture(c)
  }
  return glowMap
}

const sprite = (color, scale, opacity = 1) => {
  const s = new Sprite(new SpriteMaterial({ map: glow(), color, blending: AdditiveBlending, depthWrite: false, transparent: true, opacity }))
  s.scale.setScalar(scale)
  s.layers.set(1)
  return s
}

const solid = (geo, color) => new Mesh(geo, toon(color))

// Ursa: the logo's constellation bear, as stars joined by lines
function ursa() {
  const g = new Group()
  const stars = BEAR_STARS
  const lines = BEAR_LINES.flat()
  for (const [x, y] of stars) {
    const s = sprite('#A9C6FF', 0.32)
    s.position.set(x, y, 0)
    g.add(s)
  }
  const pts = []
  for (let i = 0; i < lines.length; i += 2) pts.push(...stars[lines[i]], 0, ...stars[lines[i + 1]], 0)
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(pts, 3))
  const l = new LineSegments(geo, new LineBasicMaterial({ color: '#3D7BFF', transparent: true, opacity: 0.85 }))
  l.layers.set(1)
  g.add(l, sprite('#3D7BFF', 2.6, 0.35))
  return g
}

function ringedPlanet() {
  const g = new Group()
  const planet = solid(new SphereGeometry(0.62, 32, 16), '#4F6FD8')
  const ring = new Mesh(new RingGeometry(0.85, 1.1, 48), new MeshBasicMaterial({ color: '#C9D8FF', side: DoubleSide }))
  ring.rotation.x = Math.PI / 2.4
  const moons = new Group()
  for (let i = 0; i < 3; i++) {
    const m = solid(new SphereGeometry(0.09, 12, 8), '#E4E8FF')
    const a = (i / 3) * Math.PI * 2
    m.position.set(Math.cos(a) * 1.3, Math.sin(a) * 0.25, Math.sin(a) * 1.3)
    moons.add(m)
  }
  g.add(planet, ring, moons)
  g.userData.spin = moons
  return g
}

function satellite() {
  const g = new Group()
  const body = solid(new BoxGeometry(0.55, 0.7, 0.55), '#E6B84A')
  const panel = (x) => {
    const p = solid(new BoxGeometry(0.95, 0.42, 0.03), '#2F4FBF')
    p.position.x = x
    return p
  }
  const dish = solid(new ConeGeometry(0.22, 0.2, 16, 1, true), '#E4E8FF')
  dish.position.y = 0.48
  g.add(body, panel(-0.85), panel(0.85), dish)
  g.rotation.z = 0.35
  return g
}

function redPlanet() {
  const g = new Group()
  g.add(solid(new SphereGeometry(0.85, 32, 16), '#C2543A'))
  const pole = solid(new CylinderGeometry(0.02, 0.02, 0.6, 6), '#E4E8FF')
  pole.position.set(0.15, 1.05, 0)
  const flag = new Mesh(new PlaneGeometry(0.32, 0.2), new MeshBasicMaterial({ color: '#FFD100', side: DoubleSide }))
  flag.position.set(0.31, 1.25, 0)
  g.add(pole, flag)
  return g
}

function comet() {
  const g = new Group()
  g.add(solid(new IcosahedronGeometry(0.42, 1), '#DDE6FF'))
  const tail = new Mesh(
    new ConeGeometry(0.4, 2.6, 24, 1, true),
    new MeshBasicMaterial({ color: '#7FA2FF', transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false, side: DoubleSide }),
  )
  tail.position.set(0.95, 0.75, 0)
  tail.rotation.z = Math.PI / 2 + 0.6
  tail.layers.set(1)
  // A dotted trail: past seasons
  for (let i = 1; i <= 5; i++) {
    const d = sprite('#C9D8FF', 0.16, 0.8 - i * 0.12)
    d.position.set(-0.55 - i * 0.32, -0.3 - i * 0.2, 0)
    g.add(d)
  }
  g.add(tail, sprite('#A9C6FF', 1.4, 0.5))
  return g
}

function station() {
  const g = new Group()
  const ring = solid(new TorusGeometry(0.75, 0.13, 10, 36), '#B8C2E6')
  const hub = solid(new CylinderGeometry(0.2, 0.2, 0.55, 16), '#E4E8FF')
  hub.rotation.x = Math.PI / 2
  g.add(ring, hub)
  for (let i = 0; i < 4; i++) {
    const spoke = solid(new CylinderGeometry(0.035, 0.035, 0.75, 6), '#8A8F99')
    spoke.rotation.z = (i * Math.PI) / 2
    spoke.position.set(Math.sin((i * Math.PI) / 2) * -0.38, Math.cos((i * Math.PI) / 2) * 0.38, 0)
    g.add(spoke)
  }
  // Lit windows
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const w = sprite('#FFD100', 0.14)
    w.position.set(Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0.15)
    g.add(w)
  }
  g.rotation.x = -0.5
  return g
}

function nebula() {
  const g = new Group()
  g.add(solid(new SphereGeometry(0.28, 16, 12), '#F2F4FF'))
  const puffs = [
    ['#3B1F73', 2.4, 0, 0, 0.9],
    ['#6E4BD8', 1.6, 0.35, 0.2, 0.7],
    ['#3D7BFF', 1.4, -0.35, -0.15, 0.6],
    ['#A9C6FF', 0.9, 0.1, -0.35, 0.5],
  ]
  for (const [color, scale, x, y, opacity] of puffs) {
    const s = sprite(color, scale, opacity)
    s.position.set(x, y, -0.1)
    g.add(s)
  }
  // Little photo frames twinkling inside
  for (const [x, y] of [[-0.5, 0.35], [0.55, -0.3], [0.2, 0.55]]) {
    const f = sprite('#FFFFFF', 0.12)
    f.position.set(x, y, 0.2)
    g.add(f)
  }
  return g
}

function escortRocket(meta) {
  const g = new Group()
  const { material } = createRocketMaterial()
  const r = new Mesh(buildPlaceholderGeometry(meta, 0.35), material)
  const k = 2 / meta.lengthM
  r.scale.setScalar(k)
  r.position.y = -1
  const flame = sprite('#FFB060', 0.7)
  flame.position.y = -1.15
  g.add(r, flame)
  g.rotation.z = -0.12
  return g
}

const BUILDERS = {
  about: ursa,
  engineering: ringedPlanet,
  projects: satellite,
  competitions: redPlanet,
  history: comet,
  team: station,
  gallery: nebula,
  sponsors: escortRocket,
}

/** All eight bodies, keyed by destination id. */
export function createBodies(parent, { slots, meta }) {
  const group = new Group()
  parent.add(group)
  const bodies = new Map()
  slots.forEach((slot, i) => {
    const node = new Group()
    const inner = BUILDERS[slot.id](meta)
    node.add(inner)
    node.scale.setScalar(slot.size)
    group.add(node)
    bodies.set(slot.id, { id: slot.id, node, inner, size: slot.size, phase: i * 1.7, emphasis: 0, home: null })
  })

  let highlighted = null
  let shown = true
  return {
    group,
    bodies,
    /** Hide the bodies (the Flight Deck's list layout) */
    show(on) {
      shown = on
    },
    highlight(id) {
      highlighted = id
    },
    /** Place each body at its slot's world position (from the engine's layout). */
    setHome(id, v) {
      const b = bodies.get(id)
      b.home = v.clone()
      b.node.position.copy(v)
    },
    /** appear 0–1: the bodies' entrance at the end of the opening sequence */
    update(time, dt, appear = 1) {
      group.visible = appear > 0.01 && shown
      for (const b of bodies.values()) {
        if (!b.home) continue
        // Spin on their own axes and bob gently; never leave their slot
        b.inner.rotation.y = time * 0.25 + b.phase
        if (b.inner.userData.spin) b.inner.userData.spin.rotation.y = time * 0.6
        b.node.position.y = b.home.y + Math.sin(time * 0.6 + b.phase) * b.size * 0.08
        const target = highlighted === b.id ? 1 : 0
        b.emphasis += (target - b.emphasis) * Math.min(1, dt * 10 || 1)
        b.node.scale.setScalar(b.size * (1 + 0.12 * b.emphasis) * appear)
      }
    },
  }
}
