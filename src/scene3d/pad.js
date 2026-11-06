import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  IcosahedronGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Shape,
  Sprite,
  SpriteMaterial,
} from 'three'
import { toon } from './toon'
import { seeded } from '../lib/random'

// The world below the rocket for the opening sequence: a dusk desert pad with mesas, a
// launch tower, exhaust smoke, and three cloud layers. The rocket never moves, so this
// whole group sits at y = -altitude and sinks away as the rocket "climbs".
// Built only when an intro plays (deep links never pay for it).

const DESERT = '#B9805A'
const MESA = '#5E3A62'
const STEEL = '#3B3F4E'

let puffMap = null
/** A soft two-tone toon puff: light top, shaded bottom. */
function puff() {
  if (!puffMap) {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(28, 24, 4, 32, 32, 31)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.55, 'rgba(232,228,240,0.95)')
    grad.addColorStop(0.8, 'rgba(176,170,196,0.7)')
    grad.addColorStop(1, 'rgba(176,170,196,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)
    puffMap = new CanvasTexture(c)
  }
  return puffMap
}

function mesa(rand) {
  const s = new Shape()
  const w = 60 + rand() * 120
  const h = 30 + rand() * 70
  const top = w * (0.35 + rand() * 0.3)
  s.moveTo(-w / 2, 0)
  s.lineTo(-top / 2 - rand() * 10, h * 0.85)
  s.lineTo(-top / 2, h)
  s.lineTo(top / 2, h)
  s.lineTo(top / 2 + rand() * 10, h * 0.8)
  s.lineTo(w / 2, 0)
  s.lineTo(-w / 2, 0)
  return new ExtrudeGeometry(s, { depth: 20 + rand() * 30, bevelEnabled: false })
}

export function createPad(parent) {
  const rand = seeded(42)
  const ground = new Group()
  parent.add(ground)

  // Desert floor
  // Big enough that its edge is always lost in the fog (no line below the horizon)
  const floor = new Mesh(new CircleGeometry(6000, 64), toon(DESERT))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.06
  ground.add(floor)

  // Distant mesas in a ring, purple with dusk haze
  const mesaMat = toon(MESA)
  for (let i = 0; i < 12; i++) {
    const m = new Mesh(mesa(rand), mesaMat)
    const a = (i / 12) * Math.PI * 2 + rand() * 0.3
    const r = 420 + rand() * 380
    m.position.set(Math.sin(a) * r, -0.5, -Math.cos(a) * r)
    m.lookAt(0, -0.5, 0)
    ground.add(m)
  }

  // Scrub brush: low, rounded clumps
  const shrubs = new InstancedMesh(new IcosahedronGeometry(0.4, 0), toon('#5F6B45'), 140)
  const mat = new Matrix4()
  for (let i = 0; i < shrubs.count; i++) {
    const a = rand() * Math.PI * 2
    const r = 5 + rand() * 90
    const s = 0.5 + rand() * 1.0
    mat.makeScale(s * 1.2, s * (0.45 + rand() * 0.3), s).setPosition(Math.sin(a) * r, 0, Math.cos(a) * r)
    shrubs.setMatrixAt(i, mat)
  }
  ground.add(shrubs)

  // Blast deflector plate and the launch tower beside the rocket
  const steel = toon(STEEL)
  const plate = new Mesh(new BoxGeometry(1.1, 0.05, 1.1), steel)
  plate.position.y = -0.04
  ground.add(plate)
  const tower = new Group()
  const H = 3.4
  for (const [x, z] of [
    [0.32, -0.12],
    [0.56, -0.12],
    [0.32, 0.12],
    [0.56, 0.12],
  ]) {
    const post = new Mesh(new BoxGeometry(0.035, H, 0.035), steel)
    post.position.set(x, H / 2 - 0.05, z)
    tower.add(post)
  }
  for (let y = 0.3; y < H; y += 0.42) {
    for (const [w, d, x, z] of [
      [0.27, 0.025, 0.44, -0.12],
      [0.27, 0.025, 0.44, 0.12],
      [0.025, 0.27, 0.32, 0],
      [0.025, 0.27, 0.56, 0],
    ]) {
      const brace = new Mesh(new BoxGeometry(w, 0.025, d), steel)
      brace.position.set(x, y, z)
      tower.add(brace)
    }
  }
  // Launch rail along the rocket (its tip stays below the nose)
  const rail = new Mesh(new CylinderGeometry(0.012, 0.012, 2.0, 6), steel)
  rail.position.set(0.105, 0.95, 0)
  tower.add(rail)
  ground.add(tower)

  // Exhaust smoke: puffs that roll out across the pad after ignition and stay behind
  const smokeMat = new SpriteMaterial({ map: puff(), color: '#EDE6F2', transparent: true, depthWrite: false })
  const smoke = Array.from({ length: 56 }, () => {
    const s = new Sprite(smokeMat.clone())
    s.layers.set(1)
    s.visible = false
    s.userData = { a: rand() * Math.PI * 2, v: 1.5 + rand() * 3.5, rise: 0.2 + rand() * 0.8, size: 0.8 + rand() * 1.4, delay: rand() * 0.5 }
    ground.add(s)
    return s
  })

  // Clouds: three layers the rocket climbs through (the middle one is the punch-through).
  // Each cloud is a few wide, flat puffs clumped together, so they read as cumulus, not balls.
  const cloudMat = new SpriteMaterial({ map: puff(), color: '#F4EAF6', transparent: true, depthWrite: false })
  const LAYERS = [
    { h: 320, n: 14, r: [25, 170], size: [16, 28], opacity: 0.55 },
    { h: 900, n: 22, r: [6, 70], size: [14, 24], opacity: 0.7 },
    { h: 1700, n: 12, r: [30, 160], size: [22, 36], opacity: 0.4 },
  ]
  const clouds = []
  for (const L of LAYERS) {
    for (let i = 0; i < L.n; i++) {
      const a = rand() * Math.PI * 2
      const r = L.r[0] + rand() * (L.r[1] - L.r[0])
      const cx = Math.sin(a) * r
      const cy = L.h + (rand() - 0.5) * 40
      const cz = Math.cos(a) * r
      const size = L.size[0] + rand() * (L.size[1] - L.size[0])
      for (let k = 0; k < 4; k++) {
        const s = new Sprite(cloudMat.clone())
        s.material.opacity = L.opacity * (0.7 + rand() * 0.3)
        s.position.set(cx + (rand() - 0.5) * size * 1.6, cy + (rand() - 0.5) * size * 0.25, cz + (rand() - 0.5) * size * 0.6)
        const k2 = size * (0.6 + rand() * 0.6)
        s.scale.set(k2 * 1.9, k2 * 0.75, 1)
        s.layers.set(1)
        ground.add(s)
        clouds.push(s)
      }
    }
  }

  let tinted = -1
  return {
    ground,
    /** Sink the world by `altitude`; `smokeAge` is seconds since ignition (or < 0); `dusk` 0–1 warms the clouds. */
    update(altitude, smokeAge, dusk) {
      ground.position.y = -altitude
      // Far above the clouds the ground is just haze: skip drawing it
      ground.visible = altitude < 3400
      for (const s of smoke) {
        const t = smokeAge - s.userData.delay
        s.visible = t > 0 && t < 9
        if (!s.visible) continue
        const { a, v: speed, rise, size } = s.userData
        const r = speed * Math.sqrt(t) * 1.6
        s.position.set(Math.sin(a) * r, 0.2 + rise * t * 0.6, Math.cos(a) * r)
        s.scale.setScalar(size * (0.6 + t * 0.9))
        s.material.opacity = Math.max(0, 0.95 - t * 0.1)
      }
      if (Math.abs(dusk - tinted) > 0.01) {
        tinted = dusk
        // Peach at sunset, blue-grey once the sky turns to space
        for (const c of clouds) c.material.color.lerpColors(NIGHT_TINT, DUSK_TINT, dusk)
      }
    },
  }
}

const DUSK_TINT = new Color('#FFC4A3')
const NIGHT_TINT = new Color('#6F78A8')
