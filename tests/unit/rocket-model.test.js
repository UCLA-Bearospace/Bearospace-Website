import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { brotliCompressSync } from 'node:zlib'
import { REGION, decodeJVM2 } from '../../src/scene3d/model.js'

const file = readFileSync('public/models/rocket.jvm2')
const meta = JSON.parse(readFileSync('src/generated/rocket.meta.json', 'utf8'))
const manifest = JSON.parse(readFileSync('assets-src/MANIFEST.json', 'utf8'))
const buf = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)

test('the generated model is from the current STL (re-run `npm run models` after changing it)', () => {
  const stl = manifest.files.find((f) => f.path === 'models/rocket.stl')
  assert.equal(meta.sourceSha256, stl.sha256)
})

test('the model fits its transfer budget (≤60 KB compressed)', () => {
  assert.ok(brotliCompressSync(file).length <= 60 * 1024)
  assert.equal(meta.file.bytes, file.length)
})

test('decodes to a nose-up rocket in metres with the tail at the origin', () => {
  const { geometry, regions } = decodeJVM2(buf)
  geometry.computeBoundingBox()
  const { min, max } = geometry.boundingBox
  assert.ok(Math.abs(min.y) < 0.002, `tail at y=0 (got ${min.y})`)
  assert.ok(Math.abs(max.y - meta.lengthM) < 0.002, `nose at y=length (got ${max.y})`)
  assert.ok(Math.abs(meta.lengthM - 2.612) < 0.01)
  assert.ok(Math.abs(meta.bodyDiameterM - 0.165) < 0.002)
  assert.equal(meta.finCount, 4)
  assert.equal(regions.length, geometry.index.count / 3)
  assert.equal(regions.length, meta.file.triangles)
})

test('every region is present and the nose is at the top', () => {
  const { geometry, regions } = decodeJVM2(buf)
  const pos = geometry.attributes.position.array
  const idx = geometry.index.array
  const seen = new Set(regions)
  for (const r of Object.values(REGION)) assert.ok(seen.has(r), `region ${r} present`)
  for (let t = 0; t < regions.length; t++) {
    if (regions[t] !== REGION.nose) continue
    const y = (pos[idx[t * 3] * 3 + 1] + pos[idx[t * 3 + 1] * 3 + 1] + pos[idx[t * 3 + 2] * 3 + 1]) / 3
    assert.ok(y > meta.lengthM - meta.noseLengthM - 0.05, `nose triangle ${t} near the top (y=${y})`)
  }
})

test('rejects files that are not JVM2', () => {
  assert.throws(() => decodeJVM2(new ArrayBuffer(64)), /not a JVM2 mesh/)
})
