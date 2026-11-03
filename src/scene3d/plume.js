import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  PointLight,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
} from 'three'

// Exhaust plume: two nested open cones with an additive, banded flame shader.
// uThrust scales brightness and length; uVacuum widens and softens it in space.

const VERT = /* glsl */ `
  uniform float uLength;
  varying float vT;
  varying vec3 vN;
  varying vec3 vV;
  varying float vAng;
  void main() {
    vT = clamp(-position.y / uLength, 0.0, 1.0);
    vAng = atan(position.z, position.x);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uThrust;
  uniform float uCore;
  uniform vec3 uHot;
  uniform vec3 uMid;
  uniform vec3 uCool;
  varying float vT;
  varying vec3 vN;
  varying vec3 vV;
  varying float vAng;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  void main() {
    float n = noise(vec2(vAng * 2.0, vT * 7.0 - uTime * 11.0)) * 0.6 + noise(vec2(vAng * 5.0, vT * 15.0 - uTime * 19.0)) * 0.4;
    // Cel bands along the flame, nudged by flicker so the edges dance
    float band = floor(clamp(vT + (n - 0.5) * 0.22, 0.0, 0.999) * 4.0) / 3.0;
    vec3 col = mix(uHot, uMid, smoothstep(0.0, 0.5, band));
    col = mix(col, uCool, smoothstep(0.5, 1.0, band));
    float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.4);
    float shock = uCore * (0.75 + 0.25 * step(0.5, fract(vT * 9.0)));
    float a = facing * (1.0 - smoothstep(0.35 + n * 0.25, 1.0, vT)) * (0.55 + 0.6 * n) * shock * uThrust;
    // Additive blending multiplies by alpha once
    gl_FragColor = vec4(col, a);
  }
`

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,225,140,0.85)')
  grad.addColorStop(0.6, 'rgba(255,120,40,0.25)')
  grad.addColorStop(1, 'rgba(255,90,30,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return new CanvasTexture(c)
}

export function createPlume(parent, { nozzleRadius = 0.05 } = {}) {
  const group = new Group()
  parent.add(group)
  const LENGTH = 2.4

  const uniforms = {
    uTime: { value: 0 },
    uThrust: { value: 1 },
    uLength: { value: LENGTH },
  }
  const make = (rTop, rBottom, core, [hot, mid, cool]) => {
    const geo = new CylinderGeometry(rTop, rBottom, LENGTH, 28, 24, true)
    geo.translate(0, -LENGTH / 2, 0)
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ...uniforms,
        uCore: { value: core },
        uHot: { value: new Color(hot) },
        uMid: { value: new Color(mid) },
        uCool: { value: new Color(cool) },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    })
    const mesh = new Mesh(geo, mat)
    mesh.layers.set(1)
    group.add(mesh)
    return mesh
  }
  // Outer flame in UCLA gold to ignition orange; a short white-hot core inside
  const outer = make(nozzleRadius * 1.2, nozzleRadius * 5.5, 0.7, ['#FFD100', '#FF6A2B', '#B8361A'])
  const inner = make(nozzleRadius * 0.8, nozzleRadius * 2.2, 1.0, ['#FFFFFF', '#FFF1A8', '#FFD100'])
  inner.scale.y = 0.55

  const glow = new Sprite(new SpriteMaterial({ map: glowTexture(), blending: AdditiveBlending, depthWrite: false, transparent: true }))
  glow.scale.setScalar(0.7)
  glow.position.y = -0.08
  glow.layers.set(1)
  group.add(glow)

  // Warm light that catches the fins and aft airframe
  const light = new PointLight('#FFB060', 3, 3.5, 2)
  light.position.y = -0.25
  group.add(light)

  return {
    group,
    uniforms,
    /** thrust 0–1, vacuum 0–1 (space: wider, longer, softer) */
    update(time, thrust, vacuum) {
      uniforms.uTime.value = time
      uniforms.uThrust.value = thrust
      const flicker = 1 + Math.sin(time * 37) * 0.03 + Math.sin(time * 23.7) * 0.02
      group.visible = thrust > 0.001
      outer.scale.set(1 + vacuum * 0.9, (0.75 + vacuum * 0.35) * flicker, 1 + vacuum * 0.9)
      inner.scale.set(1 + vacuum * 0.3, 0.55 * flicker, 1 + vacuum * 0.3)
      glow.scale.setScalar(0.45 * thrust * flicker)
      light.intensity = 3 * thrust * flicker
    },
  }
}
