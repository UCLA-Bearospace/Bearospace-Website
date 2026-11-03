import gsap from 'gsap'
import {
  DirectionalLight,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { createOutline } from './outline'
import { createSky } from './sky'
import { createStarfield } from './starfield'
import { createRocket } from './rocket'
import { createPlume } from './plume'
import { createBodies } from './bodies'
import { SLOTS, SLOT_DEPTH } from './menuSlots'
import { buildTravel } from './travel'
import { LOW_TIER, createGovernor, initialTier, pixelRatioFor } from './quality'

// Adapted from the portfolio's src/scene3d/engine.js: one imperative Three.js world that
// React only mounts. Animation code tweens the plain `state` object; frame() reads it.
//
// The rocket never moves. Flight is the world streaming past it: `scroll` (metres
// climbed) drives the star layers and the nebula, `speed` stretches stars into streaks.
//
// The camera either follows the Flight Deck "rest" shot (`follow`, built from the `rest`
// parameters every frame so the lab sliders stay live) or holds an explicit shot
// (`cam`, `look`, `fov`) framing one of the destination bodies or the rocket.

const CLIMB_RATE = 6 // metres of scroll per second at speed 1
const INK = { dark: '#07081A', light: '#C9D8FF' }
const UP = new Vector3(0, 1, 0)
const ROCKET_CENTER = new Vector3(0, 1.3, 0)
const LABEL_INSET = 24 // px kept clear of the viewport edge

export function createEngine(host, { meta, onStatus = () => {}, onProgress } = {}) {
  const renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
  renderer.outputColorSpace = SRGBColorSpace
  const canvas = renderer.domElement
  canvas.className = 'scene-canvas'
  host.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 0.1, 600)
  const outline = createOutline(renderer, camera)

  const key = new DirectionalLight('#ffffff', 2.4)
  key.position.set(-3, 5, 4)
  const back = new DirectionalLight('#6E8FFF', 1.6)
  back.position.set(4, 2, -5)
  const hemi = new HemisphereLight('#3D5BA8', '#120A2A', 0.7)
  scene.add(key, back, hemi)

  const sky = createSky(scene)
  const stars = createStarfield(scene)
  stars.group.position.y = 1.2

  // Everything that belongs to the vehicle: lean and roll apply to this group
  const vehicle = new Group()
  scene.add(vehicle)
  const loads = new AbortController()
  const rocket = createRocket(vehicle, { meta, signal: loads.signal, onProgress })
  const plume = createPlume(vehicle)
  const bodies = createBodies(scene, { slots: SLOTS, meta })

  // Tweened by animation code; read every frame
  const state = {
    speed: 1, // flight speed (streaks, scroll rate)
    thrust: 1, // plume brightness/length
    vacuum: 1, // plume shape: 0 at sea level, 1 in space
    spin: 0.12, // roll about the long axis, rad/s
    lean: 4, // degrees toward screen-right
    sway: 1, // amount of idle camera breathing
    lines: 0.2, // speed lines
    rest: { dist: 8.8, yaw: 24, height: 0.55, lookY: 1.08, fov: 30 },
    // Portrait screens: the rocket sits in the upper half, clear of the page text
    restPortrait: { dist: 9.4, lookY: 0.25 },
    follow: true, // camera follows the rest shot
    target: 'rest', // what the camera frames (or will, once a travel lands)
    cam: { x: 0, y: 0, z: 0 },
    look: { x: 0, y: 0, z: 0 },
    fov: 30,
    rim: 1.1,
    inkStrength: 0.9,
  }
  outline.setInk(INK.light)
  outline.uniforms.uDir.value.set(0, -1)

  let motion = true
  let fps = 60
  let boost = false // camera travel runs at full rate even behind a page
  let raf = 0
  let last = 0
  let acc = 0
  let time = 0
  let scroll = 0
  let width = 1
  let height = 1
  let dpr = 1
  let disposed = false
  let labels = null // Map<id, HTMLElement> pinned to the bodies
  let travel = null
  const labelCache = new WeakMap()
  const perf = { frames: new Float32Array(240), n: 0 }
  const tmp = new Vector3()
  const tmp2 = new Vector3()
  const layoutCam = new PerspectiveCamera()

  const governor = createGovernor(
    initialTier({
      coarsePointer: window.matchMedia('(pointer: coarse)').matches,
      cores: navigator.hardwareConcurrency || 8,
      memoryGb: navigator.deviceMemory || 8,
      width: window.innerWidth,
    }),
    applyTier,
  )

  function applyTier(tier) {
    dpr = pixelRatioFor(tier, window.devicePixelRatio || 1)
    renderer.setPixelRatio(dpr)
    stars.setDensity(tier >= LOW_TIER ? 0.5 : 1)
    resize()
  }

  /** The Flight Deck shot for the current aspect ratio, without the idle sway. */
  function restShot() {
    const r = camera.aspect < 1 ? { ...state.rest, ...state.restPortrait } : state.rest
    const yaw = (r.yaw * Math.PI) / 180
    return {
      cam: new Vector3(Math.sin(yaw) * r.dist, r.height, Math.cos(yaw) * r.dist),
      look: new Vector3(0, r.lookY, 0),
      fov: r.fov,
    }
  }

  /** A shot that frames `point` from `dist` metres, pushed to the right of the screen
   *  on landscape screens so the page panel on the left doesn't cover it. */
  function framingShot(point, dist) {
    const rest = restShot()
    const away = rest.cam.clone().sub(point).normalize()
    const cam = point.clone().addScaledVector(away, dist)
    const forward = away.clone().negate()
    const right = new Vector3().crossVectors(forward, UP).normalize()
    const vfov = (rest.fov * Math.PI) / 180
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect)
    const shift = camera.aspect >= 1 ? dist * Math.tan(hfov / 2) * 0.44 : 0
    return { cam, look: point.clone().addScaledVector(right, -shift), fov: rest.fov }
  }

  function resolveShot(target) {
    if (target === 'rest') return restShot()
    if (target === 'join') return framingShot(ROCKET_CENTER, 6.5)
    const b = bodies.bodies.get(target)
    return b?.home ? framingShot(b.home, b.size * 7.5) : restShot()
  }

  /** Put each body at its slot: a fixed screen position at the rest shot. */
  function layoutBodies() {
    const rest = restShot()
    layoutCam.fov = rest.fov
    layoutCam.aspect = camera.aspect
    layoutCam.position.copy(rest.cam)
    layoutCam.lookAt(rest.look)
    layoutCam.updateProjectionMatrix()
    layoutCam.updateMatrixWorld()
    for (const slot of SLOTS) {
      tmp.set(slot.nx, slot.ny, 0.5).unproject(layoutCam).sub(rest.cam).normalize()
      bodies.setHome(slot.id, rest.cam.clone().addScaledVector(tmp, SLOT_DEPTH))
    }
  }

  function setCamera(shot) {
    state.cam.x = shot.cam.x
    state.cam.y = shot.cam.y
    state.cam.z = shot.cam.z
    state.look.x = shot.look.x
    state.look.y = shot.look.y
    state.look.z = shot.look.z
    state.fov = shot.fov
  }

  // Pin each label to its body's on-screen position. Labels being hovered or focused
  // (data-hold) stay put so a target never slides out from under the pointer.
  function updateLabels() {
    if (!labels) return
    const vfov = (camera.fov * Math.PI) / 180
    for (const [id, el] of labels) {
      const b = bodies.bodies.get(id)
      if (!b || el.dataset.hold) continue
      b.node.getWorldPosition(tmp)
      const dist = tmp2.copy(tmp).sub(camera.position).length()
      tmp.project(camera)
      const r = (b.size / (dist * Math.tan(vfov / 2))) * (height / 2)
      let w = labelCache.get(el)
      if (!w) {
        w = el.firstElementChild?.offsetWidth || 0
        labelCache.set(el, w)
      }
      const x = Math.min(width - LABEL_INSET - w / 2, Math.max(LABEL_INSET + w / 2, (tmp.x * 0.5 + 0.5) * width))
      const y = Math.min(height - LABEL_INSET - 60, Math.max(LABEL_INSET + r, (-tmp.y * 0.5 + 0.5) * height))
      const prev = el.__pos
      if (prev && Math.abs(prev.x - x) + Math.abs(prev.y - y) + Math.abs(prev.r - r) < 0.5) continue
      el.__pos = { x, y, r }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      el.style.setProperty('--r', `${Math.max(22, r).toFixed(1)}px`)
    }
  }

  function frame(dt) {
    if (motion) {
      time += dt
      scroll += dt * state.speed * CLIMB_RATE
    }
    if (state.follow) setCamera(restShot())
    const s = state.sway
    const d = Math.hypot(state.cam.x, state.cam.z)
    camera.position.set(
      state.cam.x + Math.sin(time * 0.11) * d * 0.05 * s,
      state.cam.y + Math.sin(time * 0.17) * 0.12 * s,
      state.cam.z,
    )
    camera.lookAt(state.look.x, state.look.y, state.look.z)
    // Portrait screens get a wider lens so the whole rocket still fits
    const fov = state.fov * (camera.aspect < 1 ? Math.min(1.6, 1 / Math.sqrt(camera.aspect)) : 1)
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    camera.updateMatrixWorld()

    vehicle.rotation.set(0, time * state.spin, (-state.lean * Math.PI) / 180, 'ZYX')
    vehicle.position.y = Math.sin(time * 1.3) * 0.012 * s

    rocket.uniforms.uRim.value = state.rim
    plume.update(time, state.thrust, state.vacuum)
    stars.update(time, scroll, state.speed)
    sky.update(scroll)
    bodies.update(time, motion ? dt : 0)

    outline.uniforms.uStrength.value = state.inkStrength
    outline.uniforms.uAmount.value = state.lines * Math.min(1, state.speed)
    outline.uniforms.uTime.value = time
    outline.render(scene)
    updateLabels()
  }

  function loop(now) {
    raf = requestAnimationFrame(loop)
    const dt = last ? Math.min((now - last) / 1000, 1 / 15) : 0
    const raw = last ? now - last : 0
    last = now
    acc += dt
    if (acc < 1 / (boost ? 60 : fps) - 0.002) return
    const step = acc
    acc = 0
    frame(step)
    if (raw) {
      perf.frames[perf.n++ % perf.frames.length] = raw
      governor.sample(raw)
    }
  }

  function start() {
    if (raf || !motion || document.hidden || disposed) return
    last = 0
    raf = requestAnimationFrame(loop)
  }
  function stop() {
    cancelAnimationFrame(raf)
    raf = 0
  }
  const onVis = () => (document.hidden ? stop() : start())
  document.addEventListener('visibilitychange', onVis)

  function resize() {
    width = host.clientWidth || window.innerWidth
    height = host.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    outline.setSize(width, height, dpr)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    layoutBodies()
    labels?.forEach((el) => labelCache.delete(el))
    // Holding a framed shot: re-frame for the new size (a travel in flight re-resolves on landing)
    if (!state.follow && !travel) setCamera(resolveShot(state.target))
    governor.reset()
    if (!motion && !disposed) frame(0)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(host)
  applyTier(governor.tier)

  // Context loss: stop drawing and let the host decide (poster, then re-create on restore)
  const onLost = (e) => {
    e.preventDefault()
    stop()
    onStatus('lost')
  }
  const onRestored = () => onStatus('restored')
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  /** Stop a travel in flight where it is; whoever awaits it carries on. */
  function interrupt() {
    if (!travel) return
    const { tl, done } = travel
    travel = null
    tl.kill()
    boost = false
    done()
  }

  // Ready once the model settles (real or placeholder) and shaders are compiled
  const ready = rocket.loaded.then(async (kind) => {
    if (disposed) return kind
    await renderer.compileAsync(scene, camera).catch(() => {})
    if (disposed) return kind
    frame(0)
    start()
    onStatus('ready', kind)
    return kind
  })
  frame(0)

  const api = {
    state,
    ready,
    renderer,
    get model() {
      return rocket.kind
    },
    get tier() {
      return governor.tier
    },
    setTier(t) {
      governor.set(t)
    },
    setInk(which) {
      outline.setInk(INK[which] ?? which)
    },
    setMotion(on) {
      motion = on
      if (on) start()
      else {
        stop()
        frame(0)
      }
    },
    setFps(n) {
      fps = n
    },
    setBoost(on) {
      boost = on
    },
    resolveShot,
    /** Stop following the rest shot, keeping the camera where it is. */
    unfollow() {
      if (state.follow) setCamera(restShot())
      state.follow = false
    },
    /** A travel landed (or a cut happened) on `target`. */
    arrive(target) {
      state.target = target
      state.follow = target === 'rest'
      if (!state.follow) setCamera(resolveShot(target)) // exact, even if resized mid-travel
      if (!raf) frame(0)
    },
    /** Cut straight to a target (deep links, reduced motion, under the wipe). */
    place(target) {
      interrupt()
      gsap.killTweensOf([state, state.cam, state.look])
      state.lines = 0.2
      api.arrive(target)
    },
    /** Fly to a target. Finishing or interrupting resolves `finished`. A new travel
     *  starts from wherever the camera is, so interrupting never jumps. */
    travel(target) {
      interrupt()
      state.target = target
      let done
      const finished = new Promise((r) => (done = r))
      const tl = buildTravel(api, target, {
        onComplete: () => {
          if (travel?.tl === tl) travel = null
          done()
        },
      })
      travel = { tl, done }
      return {
        finished,
        hurry: (k) => tl.timeScale(k),
        finish: () => tl.progress(1),
      }
    },
    framing: () => state.target,
    attachLabels(map) {
      labels = map
      map?.forEach((el) => {
        el.__pos = null
        labelCache.delete(el)
      })
      // Position now, not next frame: hidden (unpositioned) links can't take focus
      updateLabels()
      if (!raf) frame(0)
    },
    highlight(id) {
      bodies.highlight(id)
      if (!raf) frame(0)
    },
    showBodies(on) {
      bodies.group.visible = on
      if (!raf) frame(0)
    },
    /** Deterministic still frame at time t (visual tests). */
    freeze(t) {
      stop()
      motion = true
      time = 0
      scroll = 0
      frame(t)
      motion = false
    },
    renderOnce() {
      frame(0)
    },
    /** Frame-interval stats over the last 240 rendered frames (ms). */
    stats() {
      const n = Math.min(perf.n, perf.frames.length)
      const sorted = Array.from(perf.frames.subarray(0, n)).sort((a, b) => a - b)
      const p95 = n ? sorted[Math.floor(n * 0.95)] : 0
      const mean = n ? sorted.reduce((a, b) => a + b, 0) / n : 0
      return {
        frames: n,
        p95,
        fps: mean ? 1000 / mean : 0,
        running: Boolean(raf),
        tier: governor.tier,
        dpr,
        target: state.target,
        traveling: Boolean(travel),
      }
    },
    dispose() {
      disposed = true
      interrupt()
      gsap.killTweensOf([state, state.cam, state.look])
      loads.abort()
      stop()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      scene.traverse((obj) => {
        obj.geometry?.dispose?.()
        const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
        for (const m of mats) {
          m.map?.dispose?.()
          m.dispose?.()
        }
      })
      stars.dispose()
      outline.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
  return api
}
