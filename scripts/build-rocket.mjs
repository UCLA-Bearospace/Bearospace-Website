// Converts the supplied rocket STL into a compact, web-ready mesh.
// Adapted from the portfolio's scripts/build-models.mjs (JVM1 format).
//
//   npm run models
//
// Input:  assets-src/models/rocket.stl (never modified), optional rocket.config.json
// Output: public/models/rocket.jvm2               the mesh the site loads
//         src/generated/rocket.meta.json          dimensions + profile (bundled; drives fallbacks)
//         assets-src/models/rocket.report.json    every shell, kept or dropped, and why
//
// The STL is an exported assembly in millimetres: long axis +X, nose tip at X = 0,
// 45 disconnected unnamed shells. Shells hidden inside the airframe are dropped.
// The output is in metres, nose up (+Y), with the centre of the tail at the origin
// (the plume attaches there) and the fins rotated to read as an "X" from +Z.
//
// JVM2 = JVM1 + one region byte per triangle (little-endian):
//   char[4] 'JVM2' | u32 vertexCount | u32 indexCount | u32 indexBytes (2|4)
//   f32 min[3] | f32 max[3]           (bounds for de-quantising)
//   i16 positions[vertexCount * 3]   (padded to 4 bytes)
//   u16|u32 indices[indexCount]      (padded to 4 bytes)
//   u8 regions[indexCount / 3]       (0 body, 1 nose, 2 fin, 3 hardware)
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshoptSimplifier } from 'three/examples/jsm/libs/meshopt_simplifier.module.js'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'assets-src', 'models', 'rocket.stl')
const CONFIG = path.join(ROOT, 'assets-src', 'models', 'rocket.config.json')
const REPORT = path.join(ROOT, 'assets-src', 'models', 'rocket.report.json')
const OUT = path.join(ROOT, 'public', 'models', 'rocket.jvm2')
const META = path.join(ROOT, 'src', 'generated', 'rocket.meta.json')

export const REGION = { body: 0, nose: 1, fin: 2, hardware: 3 }
const MAX_TRIANGLES = 15000

const config = existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, 'utf8')) : {}
const source = readFileSync(SRC)
const sourceSha256 = createHash('sha256').update(source).digest('hex')

// --- Parse and weld (millimetres, STL axes) -------------------------------------
let geo = new STLLoader().parse(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength))
const sourceTris = geo.attributes.position.count / 3
geo.deleteAttribute('normal')
geo = mergeVertices(geo, 1e-3)
const P = geo.attributes.position.array
const I = geo.index.array
const vertCount = P.length / 3

geo.computeBoundingBox()
const bb = geo.boundingBox
const L = bb.max.x - bb.min.x
const x0 = bb.min.x
const cy = (bb.min.y + bb.max.y) / 2
const cz = (bb.min.z + bb.max.z) / 2
const X = (v) => P[v * 3] - x0 // distance from the nose tip
const R = (v) => Math.hypot(P[v * 3 + 1] - cy, P[v * 3 + 2] - cz)

// --- Connected shells -------------------------------------------------------------
const parent = new Int32Array(vertCount).map((_, i) => i)
const find = (a) => {
  while (parent[a] !== a) a = parent[a] = parent[parent[a]]
  return a
}
const union = (a, b) => {
  a = find(a)
  b = find(b)
  if (a !== b) parent[a] = b
}
for (let t = 0; t < I.length; t += 3) {
  union(I[t], I[t + 1])
  union(I[t + 1], I[t + 2])
}
const shellOf = new Map()
const shells = []
for (let t = 0; t < I.length; t += 3) {
  const root = find(I[t])
  let s = shellOf.get(root)
  if (s === undefined) {
    s = shells.length
    shellOf.set(root, s)
    shells.push({ id: s, triangles: 0, xMin: Infinity, xMax: -Infinity, rMax: 0 })
  }
  const sh = shells[s]
  sh.triangles++
  for (let k = 0; k < 3; k++) {
    const v = I[t + k]
    sh.xMin = Math.min(sh.xMin, X(v))
    sh.xMax = Math.max(sh.xMax, X(v))
    sh.rMax = Math.max(sh.rMax, R(v))
  }
}

// Outer airframe radius: widest point ahead of the fin can
let bodyR = config.bodyRadiusMm ?? 0
if (!bodyR) for (let v = 0; v < vertCount; v++) if (X(v) < 0.85 * L) bodyR = Math.max(bodyR, R(v))

// Hidden = entirely inside the outer skin and not visible from the open aft end
for (const sh of shells) {
  const hidden = sh.rMax < bodyR - 1 && sh.xMax < L - 30
  sh.kept = config.keep?.includes(sh.id) ? true : config.drop?.includes(sh.id) ? false : !hidden
  sh.reason = config.keep?.includes(sh.id) || config.drop?.includes(sh.id) ? 'config' : hidden ? 'inside airframe' : 'visible'
}

// --- Keep visible shells, compact ------------------------------------------------
let kept = []
for (let t = 0; t < I.length; t += 3) if (shells[shellOf.get(find(I[t]))].kept) kept.push(I[t], I[t + 1], I[t + 2])
kept = new Uint32Array(kept)

let error = 0
if (kept.length / 3 > MAX_TRIANGLES) {
  await MeshoptSimplifier.ready
  ;[kept, error] = MeshoptSimplifier.simplify(kept, new Float32Array(P), 3, MAX_TRIANGLES * 3, 0.001, [])
}

const remap = new Int32Array(vertCount).fill(-1)
const mm = [] // kept vertices, STL millimetres
const idx = new Uint32Array(kept.length)
for (let i = 0; i < kept.length; i++) {
  const v = kept[i]
  if (remap[v] < 0) {
    remap[v] = mm.length / 3
    mm.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2])
  }
  idx[i] = remap[v]
}
const vX = (v) => mm[v * 3] - x0
const vA = (v) => mm[v * 3 + 1] - cy
const vB = (v) => mm[v * 3 + 2] - cz
const vR = (v) => Math.hypot(vA(v), vB(v))

// --- Geometry landmarks -----------------------------------------------------------
// Shoulder: first point from the nose where the skin reaches full diameter
let shoulderX = config.noseEndMm ?? L
if (!config.noseEndMm) for (let v = 0; v < mm.length / 3; v++) if (vR(v) >= 0.97 * bodyR) shoulderX = Math.min(shoulderX, vX(v))

// Fins: everything well outside the skin
const finVerts = []
for (let v = 0; v < mm.length / 3; v++) if (vR(v) > bodyR + 4) finVerts.push(v)
const finTipR = Math.max(...finVerts.map(vR))
const finStartX = Math.min(...finVerts.map(vX))
const tipVerts = finVerts.filter((v) => vR(v) > bodyR + 0.9 * (finTipR - bodyR))

// Fin roll angle and count from the angular clusters of the outermost vertices
const deg = (v) => ((Math.atan2(vB(v), vA(v)) * 180) / Math.PI + 360) % 360
const bins = new Array(36).fill(0)
for (const v of tipVerts) bins[Math.floor(deg(v) / 10)]++
let finCount = 0
for (let b = 0; b < 36; b++) if (bins[b] && !bins[(b + 35) % 36]) finCount++
let s = 0
let c = 0
for (const v of tipVerts) {
  const a = (deg(v) * Math.PI) / 180
  s += Math.sin(a * finCount)
  c += Math.cos(a * finCount)
}
const finAngle = ((Math.atan2(s, c) / finCount) * 180) / Math.PI // one fin's angle (degrees)
const phi = ((45 - finAngle) * Math.PI) / 180 // rotate so the fins sit on the diagonals

// --- Regions per triangle ---------------------------------------------------------
// Whole shells first (the fins, nose cone, and visible internals are separate parts),
// then small bumps on the airframe skin (rail buttons) become hardware.
for (const sh of shells) {
  if (sh.rMax > bodyR + 4) sh.region = 'fin'
  else if (sh.xMax <= shoulderX + 20) sh.region = 'nose'
  else if (sh.rMax < bodyR - 1) sh.region = 'hardware'
  else sh.region = 'body'
}
const triCount = idx.length / 3
const regions = new Uint8Array(triCount)
const counts = [0, 0, 0, 0]
for (let t = 0; t < triCount; t++) {
  const [a, b, d] = [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]]
  const x = (vX(a) + vX(b) + vX(d)) / 3
  const r = (vR(a) + vR(b) + vR(d)) / 3
  let region = REGION[shells[shellOf.get(find(kept[t * 3]))].region]
  if (region === REGION.body && r > bodyR + 1.5) region = REGION.hardware
  for (const band of config.bands ?? []) if (x >= band.fromMm && x <= band.toMm) region = REGION[band.region]
  regions[t] = region
  counts[region]++
}

// --- Transform to metres: nose up, tail centre at the origin ------------------------
const verts = new Float32Array(mm.length)
for (let v = 0; v < mm.length / 3; v++) {
  const a = vA(v)
  const b = vB(v)
  verts[v * 3] = (a * Math.cos(phi) - b * Math.sin(phi)) / 1000
  verts[v * 3 + 1] = (L - vX(v)) / 1000
  verts[v * 3 + 2] = (a * Math.sin(phi) + b * Math.cos(phi)) / 1000
}

// Outer profile (radius by height) for the instant placeholder and the SVG poster
const PROFILE_STEPS = 48
const profile = []
for (let i = 0; i <= PROFILE_STEPS; i++) {
  const x = (i / PROFILE_STEPS) * L
  let r = 0
  for (let v = 0; v < mm.length / 3; v++) if (Math.abs(vX(v) - x) < L / PROFILE_STEPS && vR(v) <= bodyR + 1) r = Math.max(r, vR(v))
  profile.push([+(r / 1000).toFixed(4), +((L - x) / 1000).toFixed(4)])
}
// Long airframe tubes only have vertices at their ends, so samples between them miss the
// skin (or catch an inner part). Between the shoulder and the end of the airframe the
// outline is the airframe.
const bodyEndX = Math.max(...shells.filter((sh) => sh.kept && sh.region === 'body').map((sh) => sh.xMax))
for (let i = 0; i <= PROFILE_STEPS; i++) {
  const x = (i / PROFILE_STEPS) * L
  if (x >= shoulderX && x <= bodyEndX) profile[i][0] = Math.max(profile[i][0], +(bodyR / 1000).toFixed(4))
}
profile[0][0] = 0 // nose tip

// --- Write JVM2 -------------------------------------------------------------------
const min = [Infinity, Infinity, Infinity]
const max = [-Infinity, -Infinity, -Infinity]
for (let i = 0; i < verts.length; i++) {
  const k = i % 3
  min[k] = Math.min(min[k], verts[i])
  max[k] = Math.max(max[k], verts[i])
}
const vertexCount = verts.length / 3
const indexBytes = vertexCount < 65536 ? 2 : 4
const pad4 = (n) => Math.ceil(n / 4) * 4
const posBytes = pad4(vertexCount * 3 * 2)
const idxBytes = pad4(idx.length * indexBytes)
const out = Buffer.alloc(40 + posBytes + idxBytes + triCount)
out.write('JVM2', 0, 'latin1')
out.writeUInt32LE(vertexCount, 4)
out.writeUInt32LE(idx.length, 8)
out.writeUInt32LE(indexBytes, 12)
for (let k = 0; k < 3; k++) {
  out.writeFloatLE(min[k], 16 + k * 4)
  out.writeFloatLE(max[k], 28 + k * 4)
}
for (let i = 0; i < verts.length; i++) {
  const k = i % 3
  const t = (verts[i] - min[k]) / (max[k] - min[k] || 1)
  out.writeInt16LE(Math.round(t * 65535) - 32768, 40 + i * 2)
}
for (let i = 0; i < idx.length; i++) {
  if (indexBytes === 2) out.writeUInt16LE(idx[i], 40 + posBytes + i * 2)
  else out.writeUInt32LE(idx[i], 40 + posBytes + i * 4)
}
out.set(regions, 40 + posBytes + idxBytes)

mkdirSync(path.dirname(OUT), { recursive: true })
mkdirSync(path.dirname(META), { recursive: true })
writeFileSync(OUT, out)

const m = (mmValue) => +(mmValue / 1000).toFixed(4)
const meta = {
  source: 'assets-src/models/rocket.stl',
  sourceSha256,
  season: '2025-26',
  units: 'm',
  lengthM: m(L),
  bodyDiameterM: m(bodyR * 2),
  finCount,
  finSpanM: m(finTipR * 2),
  noseLengthM: m(shoulderX),
  fin: {
    rootFromM: m(L - Math.max(...finVerts.map(vX))),
    rootToM: m(L - finStartX),
    tipFromM: m(L - Math.max(...tipVerts.map(vX))),
    tipToM: m(L - Math.min(...tipVerts.map(vX))),
  },
  profile,
  file: { path: '/models/rocket.jvm2', bytes: out.length, vertices: vertexCount, triangles: triCount },
}
writeFileSync(META, JSON.stringify(meta, null, 2) + '\n')

const report = {
  generated: 'npm run models',
  sourceSha256,
  sourceTriangles: sourceTris,
  bodyRadiusMm: +bodyR.toFixed(2),
  rule: 'drop shells with max radius < body radius - 1 mm that end more than 30 mm ahead of the tail',
  regionTriangles: Object.fromEntries(Object.keys(REGION).map((k) => [k, counts[REGION[k]]])),
  simplifyError: error,
  shells: shells.map((sh) => ({
    id: sh.id,
    triangles: sh.triangles,
    xMinMm: +sh.xMin.toFixed(1),
    xMaxMm: +sh.xMax.toFixed(1),
    maxRadiusMm: +sh.rMax.toFixed(1),
    kept: sh.kept,
    reason: sh.reason,
    region: sh.kept ? sh.region : null,
  })),
}
writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n')

const dropped = shells.filter((sh) => !sh.kept)
console.log(
  `rocket.stl → public/models/rocket.jvm2\n` +
    `  shells ${shells.length}: kept ${shells.length - dropped.length}, dropped ${dropped.length} (${dropped.reduce((n, sh) => n + sh.triangles, 0)} triangles)\n` +
    `  triangles ${sourceTris} → ${triCount}${error ? ` (simplified, error ${error.toFixed(4)})` : ''}\n` +
    `  regions body ${counts[0]}, nose ${counts[1]}, fin ${counts[2]}, hardware ${counts[3]}\n` +
    `  ${meta.lengthM} m long, ${meta.bodyDiameterM} m body, ${finCount} fins (span ${meta.finSpanM} m), nose ${meta.noseLengthM} m\n` +
    `  ${(out.length / 1024).toFixed(1)} KB`,
)
