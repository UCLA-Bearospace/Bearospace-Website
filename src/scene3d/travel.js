import gsap from 'gsap'
import { CatmullRomCurve3, Vector3 } from 'three'

// Camera moves between Flight Deck targets. Adapted from the portfolio's travel.js:
// each leg starts from wherever the camera is when the leg begins, so an interrupted
// move never jumps, and speed lines swell through the move and fade as it lands.

const v = (p) => new Vector3(p.x, p.y, p.z)
const lerp = (a, b, t) => a + (b - a) * t

function leg(tl, s, shot, { duration, ease, lines }) {
  const p = { t: 0 }
  let path = null
  let from = null
  // Built on whichever callback comes first: a stalled frame can render a leg
  // straight to its end without onStart
  const begin = () => {
    const a = v(s.cam)
    const b = v(shot.cam)
    // A gentle arc: lift the midpoint a little so the move reads as flight, not a dolly
    const mid = a.clone().lerp(b, 0.5).add(new Vector3(0, a.distanceTo(b) * 0.08, 0))
    path = new CatmullRomCurve3([a, mid, b], false, 'centripetal')
    from = { look: { ...s.look }, fov: s.fov }
  }
  tl.to(p, {
    t: 1,
    duration,
    ease,
    onStart() {
      if (!path) begin()
    },
    onUpdate() {
      if (!path) begin()
      const t = p.t
      const c = path.getPoint(t)
      s.cam.x = c.x
      s.cam.y = c.y
      s.cam.z = c.z
      s.look.x = lerp(from.look.x, shot.look.x, t)
      s.look.y = lerp(from.look.y, shot.look.y, t)
      s.look.z = lerp(from.look.z, shot.look.z, t)
      s.fov = lerp(from.fov, shot.fov, t)
    },
  })
  if (lines) {
    tl.to(s, { lines, duration: duration * 0.45, ease: 'power2.in' }, '<')
    tl.to(s, { lines: 0.2, duration: duration * 0.5, ease: 'power2.out' }, `<${duration * 0.5}`)
  }
}

/**
 * Travel to a target ('rest', 'join', or a body id). Resolves the shot when it starts,
 * so a resize beforehand is respected. Returns the gsap timeline (already playing).
 */
export function buildTravel(engine, target, { onComplete } = {}) {
  const s = engine.state
  // Any tween still steering the camera (a previous travel) yields
  gsap.killTweensOf([s, s.cam, s.look])
  engine.unfollow()
  const shot = engine.resolveShot(target)
  const far = v(s.cam).distanceTo(v(shot.cam))
  const duration = Math.min(1.2, 0.75 + far * 0.02)

  const tl = gsap.timeline({
    onStart: () => engine.setBoost(true),
    onComplete: () => {
      engine.setBoost(false)
      engine.arrive(target)
      onComplete?.()
    },
  })
  leg(tl, s, shot, { duration, ease: 'power2.inOut', lines: 0.55 })
  return tl
}
