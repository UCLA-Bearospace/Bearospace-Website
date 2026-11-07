import { Color, Vector4 } from 'three'
import { toon } from './toon'

// Region colours, sampled from launch photos of the carbon-fibre rocket.
export const ROCKET_COLORS = {
  body: '#23262F', // carbon fibre
  nose: '#2F6BD1', // blue nose cone
  fin: '#121319',
  hardware: '#8A8F99',
}

/**
 * Toon material for the rocket. Vertex colours carry the region colour; a per-vertex
 * `aRegion` lets the shader add a subtle carbon twill to the airframe. A fresnel rim
 * keeps a black rocket readable against a black sky. Up to two height bands (metres above
 * the tail, `uBands` = from/to, from/to) glow for the Engineering system map.
 */
export function createRocketMaterial() {
  const uniforms = {
    uRimColor: { value: new Color('#3D7BFF') },
    uRim: { value: 0.9 },
    uTwill: { value: 0.07 },
    uBands: { value: new Vector4(-1, -1, -1, -1) },
    uBandOn: { value: 0 },
    uBandColor: { value: new Color('#A9C6FF') },
  }
  const material = toon('#ffffff', { vertexColors: true })
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float aRegion;
        varying float vRegion;
        varying vec3 vObjPos;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vRegion = aRegion;
        vObjPos = position;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uRimColor;
        uniform float uRim;
        uniform float uTwill;
        uniform vec4 uBands;
        uniform float uBandOn;
        uniform vec3 uBandColor;
        varying float vRegion;
        varying vec3 vObjPos;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if (vRegion < 0.5) {
          // 2x2 twill: diagonal steps around the circumference, faded out where it would alias
          float s = atan(vObjPos.z, vObjPos.x) * 0.0826;
          float cell = 0.018;
          vec2 g = vec2(s, vObjPos.y) / cell;
          float tw = step(2.0, mod(floor(g.x) + floor(g.y), 4.0));
          float fade = 1.0 - smoothstep(0.25, 0.8, fwidth(g.x) + fwidth(g.y));
          diffuseColor.rgb *= 1.0 + (tw - 0.5) * 2.0 * uTwill * fade;
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float fres = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        totalEmissiveRadiance += uRimColor * pow(fres, 3.0) * uRim;
        float inBand = max(
          step(uBands.x, vObjPos.y) * step(vObjPos.y, uBands.y),
          step(uBands.z, vObjPos.y) * step(vObjPos.y, uBands.w)
        );
        totalEmissiveRadiance += uBandColor * inBand * uBandOn * (0.3 + 0.3 * fres);`,
      )
  }
  return { material, uniforms }
}
