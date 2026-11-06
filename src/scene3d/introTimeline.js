import gsap from 'gsap'
import { CatmullRomCurve3, Vector3 } from 'three'

// The 3D part of the opening sequence (shots C–F of docs/PLAN.md §6). The DOM handles
// A (logo) and B (sponsors) first; this timeline starts at the pad.
//
//   C  pad      0.0–1.6   camera cranes up the rocket on the rail at dusk
//   D  ignition 1.6–3.2   plume lights, smoke rolls out, liftoff at 2.0 (flash), camera
//                         stays on the pad and tilts up, then catches up and tracks
//   E  ascent   3.2–5.4   the ground and clouds drop away, cloud punch-through, dusk → space
//   F  settle   5.4–6.6   camera eases into the exact Flight Deck shot; bodies appear
//
// The rocket never moves: `altitude` sinks the world below it, `groundLock` keeps the
// camera with the ground for the launch-pad view. The timeline ends on the same state the
// Flight Deck uses, so the menu takes over without a reset.

const P = (x, y, z) => ({ x, y, z })
const SHOTS = {
  padLow: { cam: P(1.1, 0.12, 2.4), look: P(0, 0.55, 0), fov: 40 },
  padHigh: { cam: P(2.1, 1.9, 4.6), look: P(0, 2.25, 0), fov: 34 },
  track: { cam: P(2.6, 0.35, 5.8), look: P(0, 1.5, 0), fov: 34 },
  climb: { cam: P(4.0, 0.1, 9.4), look: P(0, 1.2, 0), fov: 32 },
}

export const DEFAULTS = { altitude: 3400, dusk: 0, speed: 1, thrust: 1, vacuum: 1, lines: 0.2, groundLock: 0, shake: 0, flash: 0, appear: 1 }

const v = (p) => new Vector3(p.x, p.y, p.z)
const lerp = (a, b, t) => a + (b - a) * t

function setShot(s, shot) {
  Object.assign(s.cam, shot.cam)
  Object.assign(s.look, shot.look)
  s.fov = shot.fov
}

/** A camera move from wherever the camera is when it starts (interrupt-safe). */
function move(tl, s, shot, at, duration, ease) {
  const p = { t: 0 }
  let path, from
  const begin = () => {
    const a = v(s.cam)
    const b = v(shot.cam)
    path = new CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(new Vector3(0, a.distanceTo(b) * 0.06, 0)), b], false, 'centripetal')
    from = { look: { ...s.look }, fov: s.fov }
  }
  tl.to(
    p,
    {
      t: 1,
      duration,
      ease,
      onStart: () => path || begin(),
      onUpdate() {
        if (!path) begin()
        const c = path.getPoint(p.t)
        Object.assign(s.cam, { x: c.x, y: c.y, z: c.z })
        for (const k of ['x', 'y', 'z']) s.look[k] = lerp(from.look[k], shot.look[k], p.t)
        s.fov = lerp(from.fov, shot.fov, p.t)
      },
    },
    at,
  )
}

/**
 * Builds the intro timeline (paused). `mode`: 'full' or 'short' (returning visitors:
 * just the top of the climb and the settle, 1.4 s). Callbacks: onLiftoff, onComplete.
 */
export function buildIntro(engine, mode, { onLiftoff, onComplete } = {}) {
  const s = engine.state
  gsap.killTweensOf([s, s.cam, s.look])
  const rest = engine.resolveShot('rest')
  const tl = gsap.timeline({
    paused: true,
    onComplete() {
      Object.assign(s, DEFAULTS)
      engine.arrive('rest')
      onComplete?.()
    },
  })
  s.follow = false
  s.target = 'rest'

  if (mode === 'short') {
    Object.assign(s, { altitude: 2500, dusk: 0.25, speed: 1.4, thrust: 1, vacuum: 0.8, lines: 0.5, groundLock: 0, shake: 0, flash: 0, appear: 0 })
    setShot(s, SHOTS.climb)
    tl.addLabel('ascent', 0)
    tl.to(s, { altitude: DEFAULTS.altitude, duration: 0.5, ease: 'power1.in' }, 0)
    tl.to(s, { dusk: 0, vacuum: 1, duration: 0.4, ease: 'power1.out' }, 0)
    tl.addLabel('settle', 0.4)
  } else {
    Object.assign(s, { altitude: 0, dusk: 1, speed: 0, thrust: 0, vacuum: 0, lines: 0, groundLock: 1, shake: 0, flash: 0, appear: 0 })
    setShot(s, SHOTS.padLow)

    // C: crane up the rocket
    tl.addLabel('pad', 0)
    move(tl, s, SHOTS.padHigh, 0, 1.6, 'power2.inOut')

    // D: ignition and liftoff
    tl.addLabel('ignition', 1.6)
    tl.to(s, { thrust: 1, duration: 0.25, ease: 'power2.out' }, 1.6)
    tl.call(() => engine.ignite(), null, 1.6) // smoke ages on the engine clock
    tl.to(s, { shake: 0.7, duration: 0.3, ease: 'power1.in' }, 1.6)
    tl.addLabel('liftoff', 2.0)
    tl.call(() => onLiftoff?.(), null, 2.0)
    // immediateRender: false, or the flash would be applied from the first frame
    tl.fromTo(s, { flash: 0.85 }, { flash: 0, duration: 0.14, ease: 'none', immediateRender: false }, 2.0)
    tl.to(s, { altitude: 120, duration: 1.2, ease: 'power2.in' }, 2.0)
    tl.to(s, { shake: 0, duration: 1.0, ease: 'power1.out' }, 2.2)
    tl.to(s, { lines: 0.7, duration: 0.9, ease: 'power2.in' }, 2.3)
    // The pad view lasts a beat: the rocket clears the tower, then the camera catches up
    tl.to(s, { groundLock: 0, duration: 0.35, ease: 'power2.in' }, 2.15)
    move(tl, s, SHOTS.track, 2.2, 1.0, 'power1.inOut')

    // E: ascent through the clouds into space
    tl.addLabel('ascent', 3.2)
    tl.to(s, { altitude: DEFAULTS.altitude, duration: 2.2, ease: 'power2.in' }, 3.2)
    tl.to(s, { speed: 1.6, duration: 1.6, ease: 'power1.in' }, 3.2)
    tl.to(s, { vacuum: 1, duration: 1.4, ease: 'power1.inOut' }, 3.6)
    // Cloud punch-through at ~900 m
    tl.fromTo(s, { flash: 0.5 }, { flash: 0, duration: 0.18, ease: 'none', immediateRender: false }, 4.3)
    tl.to(s, { dusk: 0, duration: 0.8, ease: 'power1.inOut' }, 4.2)
    move(tl, s, SHOTS.climb, 3.4, 2.0, 'power1.inOut')
    tl.addLabel('settle', 5.4)
  }

  // F: settle into the Flight Deck
  const t = tl.labels.settle
  const settle = mode === 'short' ? 1.0 : 1.2
  move(tl, s, rest, t, settle, 'power2.inOut')
  tl.to(s, { lines: DEFAULTS.lines, speed: DEFAULTS.speed, duration: settle - 0.2, ease: 'power1.out' }, t)
  tl.to(s, { appear: 1, duration: settle - 0.4, ease: 'back.out(1.6)' }, t + 0.2)
  return tl
}
