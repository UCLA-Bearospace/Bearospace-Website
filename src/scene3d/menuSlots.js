// Where each destination body sits on the Flight Deck, in screen space at the rest
// shot (normalized device coordinates: x and y from -1 to 1). The engine turns these
// into world positions on resize, so they always fit the view. Bodies never orbit:
// they never pass behind the rocket, so their click targets never move or overlap.
//
// Layout: the title owns the left of the screen and the rocket the centre, so the
// destinations form a staggered two-column constellation on the right, top to bottom
// in reading order (which is also the arrow-key order).

const COLS = [0.36, 0.72]
const TOP = 0.64
const STEP = 0.185

const ORDER = ['about', 'engineering', 'projects', 'competitions', 'history', 'team', 'gallery', 'sponsors']
const SIZE = { about: 0.62, engineering: 0.8, projects: 0.52, competitions: 0.62, history: 0.55, team: 0.62, gallery: 0.66, sponsors: 0.5 }

export const SLOT_DEPTH = 13 // metres from the rest camera (behind the rocket's plane)

export const SLOTS = ORDER.map((id, i) => ({
  id,
  nx: COLS[i % 2],
  ny: TOP - i * STEP,
  size: SIZE[id] * 0.5, // world radius, metres
}))
