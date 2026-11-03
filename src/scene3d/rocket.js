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

/** Instant stand-in built from the build-time profile: a lathe body plus fins. */
export function buildPlaceholderGeometry(meta) {
  const profile = meta.profile.map(([r, h]) => new Vector2(Math.max(r, 0.0005), h)).reverse()
  const noseFrom = meta.lengthM - meta.noseLengthM
  const parts = []
  const faces = []

  const lathe = new LatheGeometry(profile, 32).toNonIndexed()
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
 * The rocket: shows the placeholder immediately, swaps in the real mesh when it
 * loads, and keeps the placeholder if loading fails.
 */
export function createRocket(parent, { meta, url = meta.file.path, signal, onProgress }) {
  const { material, uniforms } = createRocketMaterial()
  const group = new Group()
  parent.add(group)

  let mesh = new Mesh(buildPlaceholderGeometry(meta), material)
  group.add(mesh)
  let kind = 'placeholder'

  const loaded = fetchMesh(url, { signal, expectedBytes: meta.file.bytes, onProgress })
    .then((buf) => {
      const { geometry, regions } = decodeJVM2(buf)
      const creased = toCreasedNormals(geometry, CREASE)
      geometry.dispose()
      const real = new Mesh(paint(creased, regions), material)
      group.remove(mesh)
      mesh.geometry.dispose()
      mesh = real
      group.add(mesh)
      kind = 'real'
      return kind
    })
    .catch((err) => {
      if (err?.name !== 'AbortError') console.warn('[rocket] model failed to load; keeping the placeholder', err)
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
