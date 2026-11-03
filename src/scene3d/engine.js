import {
  DirectionalLight,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three'
import { createOutline } from './outline'
import { createSky } from './sky'
import { createStarfield } from './starfield'
import { createRocket } from './rocket'
import { createPlume } from './plume'
import { LOW_TIER, createGovernor, initialTier, pixelRatioFor } from './quality'

// Adapted from the portfolio's src/scene3d/engine.js: one imperative Three.js world that
// React only mounts. Animation code tweens the plain `state` object; frame() reads it.
//
// The rocket never moves. Flight is the world streaming past it: `scroll` (metres
// climbed) drives the star layers and the nebula, `speed` stretches stars into streaks.

const CLIMB_RATE = 6 // metres of scroll per second at speed 1
const INK = { dark: '#07081A', light: '#C9D8FF' }

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

  // Tweened by animation code; read every frame
  const state = {
    speed: 1, // flight speed (streaks, scroll rate)
    thrust: 1, // plume brightness/length
    vacuum: 1, // plume shape: 0 at sea level, 1 in space
    spin: 0.12, // roll about the long axis, rad/s
    lean: 4, // degrees toward screen-right
    sway: 1, // amount of idle camera breathing
    lines: 0.2, // speed lines
    cam: { dist: 8.8, yaw: 24, height: 0.55, lookY: 1.08, fov: 30 },
    // Portrait screens: the rocket sits in the upper half, clear of the page text
    camPortrait: { dist: 9.4, lookY: 0.25 },
    rim: 1.1,
    inkStrength: 0.9,
  }
  outline.setInk(INK.light)
  outline.uniforms.uDir.value.set(0, -1)

  let motion = true
  let fps = 60
  let raf = 0
  let last = 0
  let acc = 0
  let time = 0
  let scroll = 0
  let width = 1
  let height = 1
  let dpr = 1
  let disposed = false
  const perf = { frames: new Float32Array(240), n: 0 }

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

  function frame(dt) {
    if (motion) {
      time += dt
      scroll += dt * state.speed * CLIMB_RATE
    }
    const s = state.sway
    const cam = camera.aspect < 1 ? { ...state.cam, ...state.camPortrait } : state.cam
    const yaw = ((cam.yaw + Math.sin(time * 0.11) * 3 * s) * Math.PI) / 180
    camera.position.set(Math.sin(yaw) * cam.dist, cam.height + Math.sin(time * 0.17) * 0.12 * s, Math.cos(yaw) * cam.dist)
    camera.lookAt(0, cam.lookY, 0)
    // Portrait screens get a wider lens so the whole rocket still fits
    const fov = state.cam.fov * (camera.aspect < 1 ? Math.min(1.6, 1 / Math.sqrt(camera.aspect)) : 1)
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    vehicle.rotation.set(0, time * state.spin, (-state.lean * Math.PI) / 180, 'ZYX')
    vehicle.position.y = Math.sin(time * 1.3) * 0.012 * s

    rocket.uniforms.uRim.value = state.rim
    plume.update(time, state.thrust, state.vacuum)
    stars.update(time, scroll, state.speed)
    sky.update(scroll)

    outline.uniforms.uStrength.value = state.inkStrength
    outline.uniforms.uAmount.value = state.lines * Math.min(1, state.speed)
    outline.uniforms.uTime.value = time
    outline.render(scene)
  }

  function loop(now) {
    raf = requestAnimationFrame(loop)
    const dt = last ? Math.min((now - last) / 1000, 1 / 15) : 0
    const raw = last ? now - last : 0
    last = now
    acc += dt
    if (acc < 1 / fps - 0.002) return
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

  return {
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
      return { frames: n, p95, fps: mean ? 1000 / mean : 0, running: Boolean(raf), tier: governor.tier, dpr }
    },
    dispose() {
      disposed = true
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
}
