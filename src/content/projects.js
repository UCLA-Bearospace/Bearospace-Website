import { SOURCES } from './org.js'

// Engineering projects, one per page at /projects/<slug>. Slugs never change.
//
//   status   proposed | in-progress | ground-tested | flown | completed
//   publish  false keeps a draft off the site until its facts are confirmed
//
// Results must be measured and sourced. Leave a section empty rather than guess;
// empty sections are not shown.

export const projects = [
  {
    slug: '2018-19-fnl-rocket',
    title: 'First Nations Launch rocket',
    season: '2018-19',
    status: 'completed',
    competitionSlug: 'first-nations-launch',
    disciplineSlugs: ['structures', 'avionics-recovery'],
    summary: 'The rocket that won first place in the AISES Launch category at First Nations Launch 2019.',
    objective: [
      'Fly a competition-supplied motor to an apogee between 3,500 and 5,000 feet above ground level, and recover the rocket safely.',
    ],
    constraints: ['Competition-supplied 54 mm AeroTech J450 DM motor', 'Apogee window: 3,500–5,000 ft AGL'],
    approach: ['A carbon-fiber airframe with a 3D-printed nose cone.'],
    hardware: [
      'About 65 in long and 3.9 in in diameter (proposal)',
      'Carbon-fiber body tube',
      '3D-printed nose cone',
      'RRC3 altimeter',
    ],
    software: ['Arduino Uno with an MPU6050 motion sensor'],
    testing: [],
    results: [
      { text: '1st place, AISES Launch category, First Nations Launch 2019', source: SOURCES.mae2019 },
    ],
    lessons: [],
    contributors: [
      { personSlug: 'lucia-gonzalez', contribution: 'Team co-leader' },
      { personSlug: 'ryan-rio', contribution: 'Team co-leader' },
    ],
    media: [],
    sources: [
      { label: 'Competition proposal (Nov 30, 2018)', url: SOURCES.proposal2018 },
      { label: 'UCLA MAE news (Jun 5, 2019)', url: SOURCES.mae2019 },
    ],
    lastVerified: '2026-11-02',
    publish: true,
    // Told in its season on History; Projects is for current designs and R&D (content review, 2026-11-10)
    place: 'history',
  },
  {
    slug: '2025-26-launch-vehicle',
    title: '2025–26 launch vehicle',
    season: '2025-26',
    status: null, // unknown until the team confirms whether and where it flew (checklist C3, D8)
    competitionSlug: 'nasa-student-launch',
    disciplineSlugs: ['aerodynamics', 'structures', 'avionics-recovery'],
    summary: 'A carbon-fiber high-power rocket, and the model behind the 3D rocket on this site.',
    objective: [],
    constraints: [],
    approach: [],
    hardware: [
      'About 2.61 m long with a 165 mm (6.5 in) airframe (measured from the team CAD model)',
      'Four fins',
      'Carbon-fiber airframe and blue nose cone (launch photos)',
    ],
    software: [],
    testing: [],
    results: [],
    lessons: [],
    contributors: [],
    media: [
      { src: 'gallery/team-carrying-carbon-rocket.jpg' },
      { src: 'gallery/carbon-rocket-carried-on-tarmac.jpg' },
    ],
    sources: [{ label: 'Team CAD model (assets-src/models/rocket.stl)', url: null }],
    lastVerified: '2026-11-02',
    publish: false,
  },
]
