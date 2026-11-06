import {
  BoxGeometry,
  BufferAttribute,
  Color,
  Group,
  LatheGeometry,
  Mesh,
  Vector2,
} from 'three'
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { REGION, decodeJVM2, fetchMesh } from './model'
import { ROCKET_COLORS, createRocketMaterial } from './rocketMaterial'

const CREASE = (35 * Math.PI) / 180
const REGION_NAMES = ['body', 'nose', 'fin', 'hardware']

/** Non-indexed geometry with creased normals, per-vertex region colour and `aRegion`. */
function paint(geometry, faceRegions) {
  const count = geometry.attributes.position.count
  const color = new Float32Array(count * 3)
  const region = new Float32Array(count)
  const palette = REGION_NAMES.map((n) => new Color(ROCKET_COLORS[n]))
  for (let v = 0; v < count; v++) {
    const r = faceRegions[Math.floor(v / 3)]
    color.set([palette[r].r, palette[r].g, palette[r].b], v * 3)
    region[v] = r
  }
  geometry.setAttribute('color', new BufferAttribute(color, 3))
  geometry.setAttribute('aRegion', new BufferAttribute(region, 1))
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * Stand-in built from the build-time profile: a lathe body plus fins. `detail` < 1 thins
 * the profile and the lathe segments (the escort rocket is drawn tiny).
 */
export function buildPlaceholderGeometry(meta, detail = 1) {
  const every = Math.max(1, Math.round(1 / detail))
  const points = meta.profile.filter((_, i, all) => i % every === 0 || i === all.length - 1)
  const profile = points.map(([r, h]) => new Vector2(Math.max(r, 0.0005), h)).reverse()
  const noseFrom = meta.lengthM - meta.noseLengthM
  const parts = []
  const faces = []

  const lathe = new LatheGeometry(profile, Math.max(8, Math.round(32 * detail))).toNonIndexed()
  const p = lathe.attributes.position.array
  for (let f = 0; f < p.length / 9; f++) {
    const y = (p[f * 9 + 1] + p[f * 9 + 4] + p[f * 9 + 7]) / 3
    faces.push(y > noseFrom ? REGION.nose : REGION.body)
  }
  parts.push(lathe)

  const r = meta.bodyDiameterM / 2
  const span = meta.finSpanM / 2 - r
  const chord = meta.fin.rootToM - meta.fin.rootFromM
  for (let i = 0; i < meta.finCount; i++) {
    const fin = new BoxGeometry(span, chord, 0.006).toNonIndexed()
    fin.translate(r + span / 2, meta.fin.rootFromM + chord / 2, 0)
    fin.rotateY(Math.PI / 4 + (i * 2 * Math.PI) / meta.finCount)
    fin.deleteAttribute('uv')
    fin.deleteAttribute('normal')
    for (let f = 0; f < fin.attributes.position.count / 3; f++) faces.push(REGION.fin)
    parts.push(fin)
  }
  lathe.deleteAttribute('uv')
  lathe.deleteAttribute('normal')
  const merged = mergeGeometries(parts)
  for (const g of parts) g.dispose()
  merged.computeVertexNormals()
  return paint(merged, faces)
}

/**
 * The rocket: the real mesh once it loads, or the placeholder if loading fails. Nothing
 * is drawn before then (the scene stays hidden until ready), so the placeholder is only
 * built when needed, and decoding yields between steps to keep the page responsive.
 */
export function createRocket(parent, { meta, url = meta.file.path, signal, onProgress }) {
  const { material, uniforms } = createRocketMaterial()
  const group = new Group()
  parent.add(group)

  let kind = 'placeholder'
  const breathe = () => new Promise((r) => setTimeout(r))

  const loaded = fetchMesh(url, { signal, expectedBytes: meta.file.bytes, onProgress })
    .then(async (buf) => {
      const { geometry, regions } = decodeJVM2(buf)
      await breathe()
      const creased = toCreasedNormals(geometry, CREASE)
      geometry.dispose()
      await breathe()
      group.add(new Mesh(paint(creased, regions), material))
      kind = 'real'
      return kind
    })
    .catch((err) => {
      if (err?.name !== 'AbortError') console.warn('[rocket] model failed to load; using the placeholder', err)
      group.add(new Mesh(buildPlaceholderGeometry(meta), material))
      return kind
    })

  return {
    group,
    uniforms,
    loaded,
    get kind() {
      return kind
    },
  }
}
