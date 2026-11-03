import { DataTexture, MeshToonMaterial, NearestFilter, RedFormat } from 'three'

// Ported from the portfolio's src/scene3d/toon.js.

let gradient = null

/** Three flat light bands: shadow, mid, lit. The core of the cel look. */
export function gradientMap() {
  if (!gradient) {
    gradient = new DataTexture(new Uint8Array([70, 160, 255]), 3, 1, RedFormat)
    gradient.minFilter = NearestFilter
    gradient.magFilter = NearestFilter
    gradient.generateMipmaps = false
    gradient.needsUpdate = true
  }
  return gradient
}

export function toon(color = '#ffffff', extra = {}) {
  return new MeshToonMaterial({ color, gradientMap: gradientMap(), ...extra })
}
