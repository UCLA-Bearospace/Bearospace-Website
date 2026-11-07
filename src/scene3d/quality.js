// Adaptive render quality. Pure logic (no three.js) so it can be unit-tested.
//
// Tiers index DPR_STEPS: 0 is sharpest. The governor watches an exponential moving
// average of frame time and steps down when frames are consistently slow, up when
// they are consistently fast, ignoring the first second after any change.

export const DPR_STEPS = [1.75, 1.5, 1.25, 1, 0.85]
export const LOW_TIER = 3 // and below: fewer stars, cheaper effects

const SLOW_MS = 20
const FAST_MS = 12
const SLOW_FOR_MS = 2000
const FAST_FOR_MS = 10000
const SETTLE_MS = 1000
const MAX_UPS = 2

// Software renderers (no GPU: SwiftShader, llvmpipe, Windows' basic driver) fill every pixel
// on the CPU, so a full-screen frame can take half a second or more. They draw at most this
// many pixels, upscaled; the image is softer but the scene keeps moving.
export const SOFTWARE_PIXELS = 360_000

/** Whether a WebGL renderer name is a CPU (software) implementation. */
export const isSoftwareRenderer = (name = '') => /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)

/** A starting tier from what the device tells us. */
export function initialTier({ coarsePointer = false, cores = 8, memoryGb = 8, width = 1440, software = false } = {}) {
  if (software || cores <= 4 || memoryGb <= 2) return 3
  if (coarsePointer || width < 900) return 2
  return 1
}

/**
 * Effective pixel ratio for a tier, never above the screen's own. With `software`, also
 * small enough that a width × height canvas stays within SOFTWARE_PIXELS.
 */
export function pixelRatioFor(tier, devicePixelRatio = 1, { width = 0, height = 0, software = false } = {}) {
  const ratio = Math.min(DPR_STEPS[tier], devicePixelRatio)
  if (!software || !width || !height) return ratio
  return Math.min(ratio, Math.sqrt(SOFTWARE_PIXELS / (width * height)))
}

export function createGovernor(tier, onChange) {
  let ema = 1000 / 60
  let settle = SETTLE_MS
  let slowFor = 0
  let fastFor = 0
  let ups = 0

  function set(next) {
    tier = Math.max(0, Math.min(DPR_STEPS.length - 1, next))
    settle = SETTLE_MS
    slowFor = 0
    fastFor = 0
    onChange(tier)
  }

  return {
    get tier() {
      return tier
    },
    /** Feed one rendered frame's interval in milliseconds. */
    sample(ms) {
      if (settle > 0) {
        settle -= ms
        return
      }
      ema += (ms - ema) * 0.1
      slowFor = ema > SLOW_MS ? slowFor + ms : 0
      fastFor = ema < FAST_MS ? fastFor + ms : 0
      if (slowFor >= SLOW_FOR_MS && tier < DPR_STEPS.length - 1) set(tier + 1)
      else if (fastFor >= FAST_FOR_MS && tier > 0 && ups < MAX_UPS) {
        ups++
        set(tier - 1)
      }
    },
    /** Pause judgement after a phase change (resize, new shot). */
    reset() {
      settle = SETTLE_MS
      slowFor = 0
      fastFor = 0
    },
    set,
  }
}
