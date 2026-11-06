// The constellation bear from the Bearospace logo, in a -1…1 box (y up). Drawn as SVG
// in the opening logo reveal and as stars in the 3D "About" body, so both match.

export const BEAR_STARS = [
  [-0.95, 0.25], [-0.55, 0.42], [-0.15, 0.35], [0.25, 0.4], [0.6, 0.15], [0.95, 0.22],
  [0.5, -0.35], [0.05, -0.4], [-0.45, -0.38], [0.85, -0.45], [-0.85, -0.5],
]

/** Pairs of star indexes joined by lines. */
export const BEAR_LINES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 9], [3, 7], [7, 8], [8, 10], [2, 8],
]
