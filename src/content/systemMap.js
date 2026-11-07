// Sections of the rocket for the Engineering system map (docs/PLAN.md §8.3). Positions are
// fractions of the rocket's length from the nose tip (0) to the tail (1).
//
// Only the outer shape is known from the 2025–26 model: the nose cone ends 0.367 m from
// the tip and the fins sit 0.026–0.148 m from the tail (src/generated/rocket.meta.json;
// tests/unit/content.test.js keeps these numbers in step with it). The internal sections are
// the usual order for a dual-deploy rocket (payload, main parachute, avionics bay, drogue)
// at typical positions. They are marked `approximate` and the page says so, until the team
// confirms the real layout (docs/CONTENT-CHECKLIST.md). Nothing inside a section is named.

export const NOSE_END = 0.1403
export const FINS = [0.9433, 0.99]

// The outline the map draws, in metres, copied from rocket.meta.json (the unit test checks
// they match). Copied rather than imported: the 3D scene chunk imports that file, and a
// page importing it too makes the bundler split the main script (a slower first paint).
// nose: [radius, distance from the tip] down to where the airframe reaches full width.
export const OUTLINE = {
  lengthM: 2.6124,
  bodyDiameterM: 0.1651,
  finSpanM: 0.5716,
  fin: { rootFromM: 0.0262, rootToM: 0.1481, tipFromM: 0.0262, tipToM: 0.1481 },
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
    id: 'recovery',
    label: 'Recovery sections, for the main and drogue parachutes',
    part: 'body',
    segments: [
      [0.33, 0.5],
      [0.58, 0.72],
    ],
    approximate: true,
  },
  {
    id: 'avionics',
    label: 'Avionics bay',
    part: 'body',
    segments: [[0.5, 0.58]],
    approximate: true,
  },
  {
    id: 'fins',
    label: 'Fins',
    part: 'fins',
    segments: [FINS],
    approximate: false,
  },
  {
    id: 'airframe',
    label: 'Airframe, couplers, and fin can',
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
