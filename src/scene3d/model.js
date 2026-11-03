import { BufferAttribute, BufferGeometry } from 'three'

// Loader for meshes written by scripts/build-rocket.mjs (JVM2 = the portfolio's
// JVM1 plus one region byte per triangle). See the script for the byte layout.

export const REGION = { body: 0, nose: 1, fin: 2, hardware: 3 }

/** Decodes a JVM2 buffer into indexed geometry plus a region per triangle. */
export function decodeJVM2(buf) {
  const view = new DataView(buf)
  const magic = String.fromCharCode(...new Uint8Array(buf, 0, 4))
  if (magic !== 'JVM2') throw new Error(`not a JVM2 mesh (${magic})`)
  const vertexCount = view.getUint32(4, true)
  const indexCount = view.getUint32(8, true)
  const indexBytes = view.getUint32(12, true)
  const min = [0, 1, 2].map((k) => view.getFloat32(16 + k * 4, true))
  const max = [0, 1, 2].map((k) => view.getFloat32(28 + k * 4, true))

  const q = new Int16Array(buf, 40, vertexCount * 3)
  const pos = new Float32Array(vertexCount * 3)
  for (let i = 0; i < pos.length; i++) {
    const k = i % 3
    pos[i] = min[k] + ((q[i] + 32768) / 65535) * (max[k] - min[k])
  }
  const pad4 = (n) => Math.ceil(n / 4) * 4
  const posBytes = pad4(vertexCount * 3 * 2)
  const index =
    indexBytes === 2
      ? new Uint16Array(buf, 40 + posBytes, indexCount)
      : new Uint32Array(buf, 40 + posBytes, indexCount)
  const regions = new Uint8Array(buf, 40 + posBytes + pad4(indexCount * indexBytes), indexCount / 3)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(pos, 3))
  geometry.setIndex(new BufferAttribute(index, 1))
  return { geometry, regions }
}

/**
 * Fetches a mesh, reporting progress as a 0–1 fraction. `expectedBytes` (from the
 * build-time meta) stands in when the response is compressed and has no usable length.
 */
export async function fetchMesh(url, { signal, expectedBytes, onProgress } = {}) {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  const total = Number(res.headers.get('content-length')) || expectedBytes || 0
  if (!res.body || !onProgress || !total) {
    const buf = await res.arrayBuffer()
    onProgress?.(1)
    return buf
  }
  const reader = res.body.getReader()
  const chunks = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    onProgress(Math.min(1, received / total))
  }
  const out = new Uint8Array(received)
  let o = 0
  for (const c of chunks) {
    out.set(c, o)
    o += c.length
  }
  onProgress(1)
  return out.buffer
}
