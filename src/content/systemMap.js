// Sections of the rocket for the Engineering system map (docs/PLAN.md §8.3). Positions are
// fractions of the rocket's length from the nose tip (0) to the tail (1).
//
// Only the outer shape is known from the 2025–26 model: the nose cone ends 0.367 m from
// the tip, and the swept fins meet the airframe 0.103–0.265 m from the tail, their tips
// reaching back to 0.026 m (src/generated/rocket.meta.json; tests/unit/content.test.js keeps
// these numbers in step with it). The internal sections are the usual order for a
// dual-deploy rocket (payload, main parachute, avionics bay, drogue) at typical positions. They are marked `approximate` and the page says so, until the team
// confirms the real layout (docs/CONTENT-CHECKLIST.md). Nothing inside a section is named.

export const NOSE_END = 0.1403
export const FINS = [0.8984, 0.9606] // where the fin roots meet the airframe

// The outline the map draws, in metres, copied from rocket.meta.json (the unit test checks
// they match). Copied rather than imported: the 3D scene chunk imports that file, and a
// page importing it too makes the bundler split the main script (a slower first paint).
// nose: [radius, distance from the tip] down to where the airframe reaches full width.
export const OUTLINE = {
  lengthM: 2.6124,
  bodyDiameterM: 0.1651,
  finSpanM: 0.5716,
  fin: { rootFromM: 0.1029, rootToM: 0.2654, tipFromM: 0.0262, tipToM: 0.1481 },
  nose: [
    [0, 0],
    [0.0363, 0.0544],
    [0.0528, 0.1089],
    [0.0621, 0.1633],
    [0.0697, 0.2177],
    [0.0753, 0.2721],
    [0.082, 0.3266],
  ],
}

export const zones = [
  {
    id: 'nose',
    label: 'Nose cone',
    part: 'body',
    segments: [[0, NOSE_END]],
    approximate: false,
  },
  {
    id: 'payload',
    label: 'Payload section',
    part: 'body',
    segments: [[NOSE_END, 0.33]],
    approximate: true,
  },
  {
    // One subteam, one section (content review, 2026-11-10): the main parachute bay, the
    // avionics bay, and the drogue parachute bay, drawn as three bays
    id: 'avionics-recovery',
    label: 'Avionics and recovery: main parachute, avionics bay, and drogue parachute',
    part: 'body',
    segments: [
      [0.33, 0.5],
      [0.5, 0.58],
      [0.58, 0.72],
    ],
    approximate: true,
  },
  {
    // Aerodynamics builds the fin jig and assembles the fin can (content review, 2026-11-10)
    id: 'fins',
    label: 'Fins and fin can',
    part: 'fins',
    segments: [[FINS[0], 1]],
    approximate: false,
  },
  {
    id: 'airframe',
    label: 'Airframe and couplers',
    part: 'outline',
    segments: [[NOSE_END, 1]],
    approximate: false,
  },
  {
    id: 'ground',
    label: 'Ground and launch operations',
    part: 'ground',
    segments: [],
    approximate: false,
  },
]

export const ZONE_IDS = zones.map((z) => z.id)
