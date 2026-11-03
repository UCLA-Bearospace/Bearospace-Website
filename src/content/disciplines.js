import { SOURCES } from './org.js'

// The seven technical disciplines. Facts come from the Technical Programs pages of the
// current Google Site (one URL per discipline). A discipline can belong to more than one
// division: Payload Electronics is shared by Avionics and Payload.
//
// regionId ties a discipline to a part of the rocket model for the system map
// (nose, body, fin, hardware, or null for ground work).

const page = (slug) => `https://sites.google.com/view/uclabearospace/technical-programs/${slug}`

export const disciplines = [
  {
    slug: 'aerodynamics',
    name: 'Aerodynamics',
    divisionIds: ['vehicle'],
    primaryDivisionId: 'vehicle',
    summary: 'How the vehicle flies: stability, drag, and performance.',
    lede:
      'Aerodynamics decides how the rocket flies. We study stability, drag, and performance, and design the external shape — fins, nose cone, boattail — plus experimental control hardware like active airbrakes. Every choice shows up in the altitude and stability of the flight.',
    responsibilities: [
      'Flight stability, drag reduction, and performance optimization',
      'External components: fins, nose cones, boattails, and active airbrake systems',
      'Experimental flight-control technologies',
    ],
    work: [
      'Flight profile optimization',
      'Fin design and validation',
      'Nose cone development',
      'Active boattail development',
      'Active airbrake development',
      'Computational fluid dynamics (CFD)',
    ],
    tools: ['Computational modeling and CFD'],
    skills: ['CFD simulation', 'Aerospace analysis', 'Design validation', 'Flight dynamics', 'Technical research'],
    regionId: 'nose',
    source: page('aerodynamics'),
  },
  {
    slug: 'structures',
    name: 'Structures',
    divisionIds: ['vehicle'],
    primaryDivisionId: 'vehicle',
    summary: "The rocket's physical framework, and integrating every system into one vehicle.",
    lede:
      'Structures turns designs into flight-ready hardware. We lay up carbon fiber and fiberglass, fit aluminum hardware, and bond it all with aerospace epoxies — balancing weight, strength, manufacturability, and safety. Structures also leads integration, making sure every system fits and works as one vehicle.',
    responsibilities: [
      'Airframes, bulkheads, motor mounts, and couplers',
      'Composite and aluminum manufacturing',
      'Integration of all major flight systems',
    ],
    work: [
      'Airframe construction',
      'Bulkhead fabrication',
      'Motor mount development',
      'Coupler manufacturing',
      'Weight optimization',
      'Component integration',
    ],
    tools: ['SolidWorks CAD', 'Carbon fiber, fiberglass, aluminum, aerospace epoxies'],
    skills: [
      'Composite manufacturing',
      'Finite element analysis (FEA)',
      'Aerospace structures',
      'Mechanical design',
      'Manufacturing processes',
    ],
    regionId: 'body',
    source: page('internalexternal-structures'),
  },
  {
    slug: 'recovery',
    name: 'Recovery',
    divisionIds: ['vehicle'],
    primaryDivisionId: 'vehicle',
    summary: 'Bringing the rocket and payload home safely after flight.',
    lede:
      "Recovery brings the rocket and payload home safely. We design dual-deployment systems — a drogue parachute and a main parachute — size black-powder charges and shear pins, sequence deployment, and test until it's reliable. It's one of the most safety-critical jobs on the team and a real introduction to reliability engineering.",
    responsibilities: [
      'Dual-deployment recovery with drogue and main parachutes',
      'Deployment mechanisms that work reliably under extreme conditions',
      'Descent-rate, black-powder charge, and shear-pin calculations; deployment sequencing',
    ],
    work: [
      'Drogue deployment systems',
      'Main parachute systems',
      'Avionics bay integration',
      'Black powder testing',
      'Recovery validation campaigns',
      'Flight readiness verification',
    ],
    tools: [],
    skills: ['Recovery system design', 'Reliability engineering', 'Flight testing', 'Data analysis', 'Systems validation'],
    regionId: 'body',
    source: page('recovery-systems'),
  },
  {
    slug: 'avionics',
    name: 'Avionics',
    divisionIds: ['avionics'],
    primaryDivisionId: 'avionics',
    summary: 'Flight computers, sensors, telemetry, power, and recovery electronics.',
    lede:
      "Avionics is the rocket's nervous system: flight computers, sensors, telemetry, power distribution, and the electronics that fire recovery events. Members design circuit boards, write embedded code, and test it on the bench before it ever flies.",
    responsibilities: [
      'Sensors, flight computers, and telemetry systems',
      'Power distribution and deployment electronics',
      'Real-time flight data for payload operation and recovery',
    ],
    work: [
      'Flight computer integration',
      'Sensor networks',
      'Telemetry systems',
      'Power management',
      'Data acquisition systems',
      'Recovery electronics',
    ],
    tools: [],
    skills: ['PCB design', 'Embedded programming', 'Sensor integration', 'Electrical testing', 'Data systems engineering'],
    regionId: 'body',
    source: page('electronics'),
  },
  {
    slug: 'payload-electronics',
    name: 'Payload Electronics',
    divisionIds: ['avionics', 'payload'],
    primaryDivisionId: 'payload',
    summary: 'The electrical architecture that lets the payload act on its own.',
    lede:
      'Payload Electronics builds the electrical architecture that lets the payload act on its own — custom circuit boards, wiring harnesses, sensors, motor control, and power systems that survive launch loads.',
    responsibilities: [
      'Custom circuit boards capable of surviving launch environments',
      'Sensors, motor control, and power distribution for the payload',
      'Electronics for autonomous payload functions',
    ],
    work: [
      'Custom PCB development',
      'Wiring harness design',
      'Sensor integration',
      'Motor control systems',
      'Autonomous electronics',
    ],
    tools: [],
    skills: ['PCB design', 'Electronics architecture', 'Power systems', 'Sensor networks', 'Hardware integration'],
    regionId: 'body',
    source: page('payload-electronics'),
  },
  {
    slug: 'payload',
    name: 'Payload Development',
    divisionIds: ['payload'],
    primaryDivisionId: 'payload',
    summary: "Turning each year's payload challenge into flight hardware.",
    lede:
      'Each year brings a new payload challenge. Payload Development turns it into a mission: concept, CAD, structural analysis, manufacturing, assembly, autonomous mechanisms, and field testing — all designed to fit and survive inside the airframe.',
    responsibilities: [
      "Concept development for each year's payload challenge",
      'Design, analysis, manufacturing, assembly, and testing of the payload',
      'Compatibility with the vehicle airframe',
    ],
    work: [
      'Mission architecture',
      'CAD development',
      'Structural analysis',
      'Mechanical assembly',
      'Autonomous mechanisms',
      'Field testing',
    ],
    tools: [],
    skills: ['Systems engineering', 'CAD design', 'FEA', 'Mechanical integration', 'Project management'],
    regionId: 'body',
    source: page('payload-development'),
  },
  {
    slug: 'safety-operations',
    name: 'Safety & Operations',
    divisionIds: ['safety-operations'],
    primaryDivisionId: 'safety-operations',
    summary: 'Procedures, documentation, and compliance behind every build and launch.',
    lede:
      'Safety & Operations keeps every build and launch safe and by the book: manufacturing procedures, documentation, risk assessments, safety reviews, lab management, tool upkeep, procurement, and compliance with competition and launch rules.',
    responsibilities: [
      'Manufacturing safety procedures',
      'Engineering documentation',
      'Risk assessments and safety reviews',
      'Laboratory management',
      'Tool and equipment maintenance',
      'Material procurement',
      'Compliance oversight',
    ],
    work: [],
    tools: [],
    skills: ['Technical leadership', 'Engineering documentation', 'Operational management', 'Risk management'],
    regionId: null,
    source: page('safety-operations'),
  },
]

/** How software shows up across the vehicle (Engineering overview). */
export const software = {
  title: 'Software across the vehicle',
  body: [
    'Software runs through every system. Embedded code on the flight computers records sensor data and fires recovery events. Payload software drives the autonomous mechanisms inside the payload. Analysis scripts support simulation, CFD, and post-flight data review.',
  ],
  links: ['avionics', 'payload', 'payload-electronics', 'aerodynamics'],
  source: SOURCES.sitePrograms,
}
