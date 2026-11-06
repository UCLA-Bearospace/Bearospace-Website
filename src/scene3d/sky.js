import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three'

// Deep-space dome in the logo's palette: ink to night, with posterised nebula clouds
// (purple, with blue wisps) drifting slowly downward as the rocket climbs.
// Adapted from the portfolio's sky dome (gl_Position = p.xyww pins it to the far plane,
// so the outline pass treats it as sky).

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uNight;
  uniform vec3 uNebula;
  uniform vec3 uWisp;
  uniform float uScroll;
  uniform float uStrength;
  uniform float uDusk;
  uniform vec3 uSunDir;
  uniform vec3 uDuskGround;
  uniform vec3 uDuskHorizon;
  uniform vec3 uDuskMid;
  uniform vec3 uDuskHigh;
  uniform vec3 uDuskTop;
  varying vec3 vDir;
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < OCTAVES; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }
  // Soft-edged posterise: flat comic bands without hard aliasing
  float bands(float v, float n) { float s = v * n; return (floor(s) + smoothstep(0.42, 0.58, fract(s))) / n; }
  void main() {
    vec3 d = normalize(vDir);
    vec3 col = mix(uNight, uInk, smoothstep(-0.4, 0.8, d.y));
    vec3 q = d * 2.2 + vec3(0.0, uScroll, 0.0);
    // A diagonal band, like the logo's nebula
    float lane = exp(-pow((d.y + d.x * 0.55 - 0.1) * 2.4, 2.0));
    float cloud = smoothstep(0.42, 0.85, fbm(q)) * lane;
    // Thin filaments: ridges of a second noise field, kept inside the clouds
    float ridge = 1.0 - abs(fbm(q * 1.7 + 4.0) * 2.0 - 1.0);
    float wisp = pow(ridge, 8.0) * cloud;
    col = mix(col, uNebula, bands(cloud, 3.0) * 0.7 * uStrength);
    col += uWisp * wisp * 0.35 * uStrength;
    // Dusk over the desert (opening sequence): a banded sunset gradient that gives way
    // to the nebula as the rocket climbs
    if (uDusk > 0.001) {
      float h = d.y;
      vec3 dusk = h < 0.0 ? uDuskGround : mix(uDuskHorizon, uDuskMid, bands(smoothstep(0.0, 0.14, h), 3.0));
      dusk = mix(dusk, uDuskHigh, smoothstep(0.1, 0.42, h));
      dusk = mix(dusk, uDuskTop, smoothstep(0.38, 0.95, h));
      float sun = max(dot(d, normalize(uSunDir)), 0.0);
      dusk += vec3(1.0, 0.72, 0.42) * (step(0.9985, sun) * 0.9 + pow(sun, 7.0) * 0.32) * step(0.0, h + 0.01);
      col = mix(col, dusk, uDusk);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

export function createSky(parent, { octaves = 4 } = {}) {
  const uniforms = {
    uInk: { value: new Color('#07081A') },
    uNight: { value: new Color('#11143A') },
    uNebula: { value: new Color('#3B1F73') },
    uWisp: { value: new Color('#3D7BFF') },
    uScroll: { value: 0 },
    uStrength: { value: 1 },
    uDusk: { value: 0 },
    uSunDir: { value: new Vector3(-0.45, 0.035, -1) },
    uDuskGround: { value: new Color('#9A4E7A') }, // = the dusk fog, so the desert's edge vanishes
    uDuskHorizon: { value: new Color('#FF8A4C') },
    uDuskMid: { value: new Color('#C2547A') },
    uDuskHigh: { value: new Color('#3B2A78') },
    uDuskTop: { value: new Color('#141A48') },
  }
  const dome = new Mesh(
    new SphereGeometry(500, 32, 16),
    new ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      defines: { OCTAVES: octaves },
      side: BackSide,
      depthWrite: false,
    }),
  )
  dome.layers.set(1)
  dome.frustumCulled = false
  dome.renderOrder = -1
  parent.add(dome)

  return {
    dome,
    uniforms,
    /** dusk 1 = sunset over the desert, 0 = deep space */
    update(scroll, dusk = 0) {
      // Very slow: the nebula is far away
      uniforms.uScroll.value = scroll * 0.0015
      uniforms.uDusk.value = dusk
    },
  }
}
