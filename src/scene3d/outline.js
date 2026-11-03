import {
  Color,
  DepthTexture,
  HalfFloatType,
  Mesh,
  MeshNormalMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from 'three'

// Ported from the portfolio's src/scene3d/outline.js. Changes: distance thinning
// tuned for a rocket a few metres away, and speed lines can stream in one direction
// (uDir) as well as radiate from the centre.

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

// Ink lines from (a) jumps in inverse depth (silhouettes: planes are linear in
// 1/z, so the Laplacian only fires at breaks) and (b) creases in the normals.
const COMPOSITE = /* glsl */ `
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform sampler2D tNormal;
  uniform vec2 uTexel;
  uniform float uWidth;
  uniform float uNear;
  uniform float uFar;
  uniform vec3 uInk;
  uniform float uStrength;
  varying vec2 vUv;

  float viewZ(vec2 uv) {
    float z = texture2D(tDepth, uv).x;
    return (2.0 * uNear * uFar) / (uFar + uNear - (z * 2.0 - 1.0) * (uFar - uNear));
  }
  float isSky(vec2 uv) { return step(0.99999, texture2D(tDepth, uv).x); }
  vec3 nrm(vec2 uv) { return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }

  void main() {
    vec3 color = texture2D(tColor, vUv).rgb;
    vec2 ox = vec2(uTexel.x * uWidth, 0.0);
    vec2 oy = vec2(0.0, uTexel.y * uWidth);

    float s0 = isSky(vUv);
    float skyEdge = abs(s0 - isSky(vUv + ox)) + abs(s0 - isSky(vUv - ox)) + abs(s0 - isSky(vUv + oy)) + abs(s0 - isSky(vUv - oy));

    float d0 = viewZ(vUv);
    float w0 = 1.0 / d0;
    float lap = abs(1.0 / viewZ(vUv + ox) + 1.0 / viewZ(vUv - ox) - 2.0 * w0)
              + abs(1.0 / viewZ(vUv + oy) + 1.0 / viewZ(vUv - oy) - 2.0 * w0);
    float depthEdge = smoothstep(0.035, 0.09, lap / w0) * (1.0 - s0);

    vec3 n0 = nrm(vUv);
    float v0 = step(0.5, length(n0));
    float creaseEdge = 0.0;
    vec2 offs[4];
    offs[0] = ox; offs[1] = -ox; offs[2] = oy; offs[3] = -oy;
    for (int i = 0; i < 4; i++) {
      vec3 n1 = nrm(vUv + offs[i]);
      float valid = v0 * step(0.5, length(n1));
      creaseEdge = max(creaseEdge, valid * smoothstep(0.35, 0.65, 1.0 - dot(normalize(n0), normalize(n1))));
    }

    float edge = max(min(skyEdge, 1.0), max(depthEdge, creaseEdge));
    edge *= mix(1.0, 0.45, smoothstep(40.0, 160.0, d0));
    gl_FragColor = vec4(mix(color, uInk, edge * uStrength), 1.0);
    #include <colorspace_fragment>
  }
`

// Manga speed lines + impact flash, drawn over everything.
// uDir = (0,0): radial burst from the centre; otherwise lines stream along uDir.
const OVERLAY = /* glsl */ `
  uniform float uAmount;
  uniform float uFlash;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uDir;
  uniform vec3 uLine;
  uniform vec3 uFlashColor;
  varying vec2 vUv;
  float h1(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float line;
    if (dot(uDir, uDir) > 0.0) {
      // Streaming: thin columns across the flow, scrolling along it
      vec2 d = normalize(uDir);
      float across = dot(p, vec2(-d.y, d.x)) * 90.0;
      float along = dot(p, d);
      float col = floor(across);
      float h = h1(col * 1.37);
      // Short dashes that race along the flow; each column has its own pace
      float dash = fract(along * (2.0 + h * 2.0) - uTime * (2.5 + h * 3.0) + h * 9.0);
      float thin = step(abs(fract(across) - 0.5), 0.05 + 0.08 * h);
      float keepOut = smoothstep(0.12, 0.42, abs(p.x));
      line = step(0.86, h) * thin * smoothstep(0.0, 0.04, dash) * step(dash, 0.16) * keepOut;
    } else {
      float r = length(p);
      float a = (atan(p.y, p.x) + 3.14159265) / 6.2831853 * 220.0;
      float seg = floor(a);
      float h = h1(seg * 1.37 + floor(uTime * 20.0) * 7.13);
      float thin = step(abs(fract(a) - 0.5), 0.12 + 0.3 * h);
      line = step(0.66, h) * thin * smoothstep(0.22 + h * 0.2, 0.62, r);
    }
    float alpha = line * uAmount;
    vec3 col = uLine;
    if (uFlash > 0.0) { col = uFlashColor; alpha = uFlash; }
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`

export function createOutline(renderer, camera) {
  const colorRT = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 })
  colorRT.depthTexture = new DepthTexture(1, 1)
  const normalRT = new WebGLRenderTarget(1, 1)
  const normalMat = new MeshNormalMaterial()
  const clear = new Color(0.5, 0.5, 0.5)

  const quadGeo = new PlaneGeometry(2, 2)
  const orthoCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const composite = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: COMPOSITE,
    uniforms: {
      tColor: { value: colorRT.texture },
      tDepth: { value: colorRT.depthTexture },
      tNormal: { value: normalRT.texture },
      uTexel: { value: new Vector2() },
      uWidth: { value: 1.4 },
      uNear: { value: camera.near },
      uFar: { value: camera.far },
      uInk: { value: new Color('#07081A') },
      uStrength: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
  })
  const overlay = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: OVERLAY,
    uniforms: {
      uAmount: { value: 0 },
      uFlash: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uDir: { value: new Vector2(0, 0) },
      uLine: { value: new Color('#A9C6FF') },
      uFlashColor: { value: new Color('#ffffff') },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
  const postScene = new Scene()
  postScene.add(new Mesh(quadGeo, composite))
  const overlayMesh = new Mesh(quadGeo, overlay)
  overlayMesh.renderOrder = 1
  postScene.add(overlayMesh)

  return {
    uniforms: { ...composite.uniforms, ...overlay.uniforms },
    setInk(hex) {
      composite.uniforms.uInk.value.set(hex)
    },
    setSize(w, h, pixelRatio) {
      const W = Math.max(1, Math.floor(w * pixelRatio))
      const H = Math.max(1, Math.floor(h * pixelRatio))
      colorRT.setSize(W, H)
      normalRT.setSize(W, H)
      composite.uniforms.uTexel.value.set(1 / W, 1 / H)
      composite.uniforms.uWidth.value = Math.max(1, 1.1 * pixelRatio)
      overlay.uniforms.uAspect.value = w / h
    },
    render(scene) {
      composite.uniforms.uNear.value = camera.near
      composite.uniforms.uFar.value = camera.far

      camera.layers.enableAll()
      renderer.setRenderTarget(colorRT)
      renderer.render(scene, camera)

      // Normals of solid geometry only (layer 0); sky, stars, and plume stay out
      const bg = scene.background
      const fog = scene.fog
      scene.background = clear
      scene.fog = null
      scene.overrideMaterial = normalMat
      camera.layers.set(0)
      renderer.setRenderTarget(normalRT)
      renderer.render(scene, camera)
      camera.layers.enableAll()
      scene.overrideMaterial = null
      scene.background = bg
      scene.fog = fog

      renderer.setRenderTarget(null)
      overlayMesh.visible = overlay.uniforms.uAmount.value > 0.001 || overlay.uniforms.uFlash.value > 0
      renderer.render(postScene, orthoCam)
    },
    dispose() {
      colorRT.depthTexture.dispose()
      colorRT.dispose()
      normalRT.dispose()
      normalMat.dispose()
      composite.dispose()
      overlay.dispose()
      quadGeo.dispose()
    },
  }
}
