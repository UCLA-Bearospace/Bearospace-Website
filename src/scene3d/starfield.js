import {
  AdditiveBlending,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
} from 'three'
import { seeded } from '../lib/random'

// Stars and dust that stream downward past a stationary rocket. The rocket never
// moves; `scroll` (metres climbed) wraps each layer vertically on the GPU, and
// higher speed stretches stars into streaks. Nearer layers move faster (parallax).

const VERT = /* glsl */ `
  attribute vec3 aPos;
  attribute float aSeed;
  uniform float uScroll;
  uniform float uSpeed;
  uniform float uSpan;
  uniform float uK;
  uniform float uSize;
  uniform float uStretch;
  varying vec2 vUv;
  varying float vSeed;
  void main() {
    vec3 p = aPos;
    p.y = mod(p.y - uScroll * uK, uSpan) - uSpan * 0.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float size = uSize * (0.5 + aSeed);
    float len = size * (1.0 + uStretch * uSpeed);
    mv.xy += vec2(position.x * size, position.y * len);
    vUv = position.xy * 2.0;
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vSeed;
  void main() {
    float d = length(vUv);
    float a = 1.0 - smoothstep(0.2, 1.0, d);
    a *= 0.75 + 0.25 * sin(uTime * (1.5 + vSeed * 3.0) + vSeed * 60.0);
    vec3 col = vSeed > 0.93 ? vec3(1.0, 0.86, 0.35) : mix(vec3(1.0), vec3(0.66, 0.78, 1.0), fract(vSeed * 7.0));
    gl_FragColor = vec4(col * a * uOpacity, a * uOpacity);
  }
`

// count, half-width, depth range (z from the rocket), span, parallax factor, size, streak gain
const LAYERS = [
  { count: 1400, w: 110, z: [-140, -60], span: 140, k: 0.2, size: 0.2, stretch: 0.3, opacity: 0.85 },
  { count: 420, w: 36, z: [-40, -12], span: 52, k: 0.55, size: 0.05, stretch: 2.5, opacity: 0.8 },
  { count: 50, w: 5, z: [-3, 3], span: 14, k: 1.0, size: 0.01, stretch: 22, opacity: 0.4 },
]

export function createStarfield(parent, { seed = 7 } = {}) {
  const group = new Group()
  parent.add(group)
  const rand = seeded(seed)
  const quad = new PlaneGeometry(1, 1)
  const shared = { uScroll: { value: 0 }, uSpeed: { value: 0 }, uTime: { value: 0 } }

  const layers = LAYERS.map((L) => {
    const geo = new InstancedBufferGeometry()
    geo.index = quad.index
    geo.setAttribute('position', quad.attributes.position)
    const pos = new Float32Array(L.count * 3)
    const seedAttr = new Float32Array(L.count)
    for (let i = 0; i < L.count; i++) {
      let x = (rand() * 2 - 1) * L.w
      const z = L.z[0] + rand() * (L.z[1] - L.z[0])
      // Keep dust out of a column around the rocket so it never crosses the airframe
      if (L.k === 1 && Math.abs(x) < 0.6 && z > -0.6) x += Math.sign(x || 1) * 0.8
      pos.set([x, rand() * L.span, z], i * 3)
      seedAttr[i] = rand()
    }
    geo.setAttribute('aPos', new InstancedBufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new InstancedBufferAttribute(seedAttr, 1))
    geo.instanceCount = L.count

    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...shared,
        uSpan: { value: L.span },
        uK: { value: L.k },
        uSize: { value: L.size },
        uStretch: { value: L.stretch },
        uOpacity: { value: L.opacity },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const mesh = new Mesh(geo, mat)
    mesh.frustumCulled = false
    mesh.layers.set(1)
    group.add(mesh)
    return { mesh, geo, count: L.count }
  })

  return {
    group,
    update(time, scroll, speed) {
      shared.uTime.value = time
      shared.uScroll.value = scroll
      shared.uSpeed.value = speed
    },
    /** 0–1 share of each layer drawn (quality tiers). */
    setDensity(f) {
      for (const l of layers) l.geo.instanceCount = Math.max(1, Math.round(l.count * f))
    },
    dispose() {
      quad.dispose()
    },
  }
}
