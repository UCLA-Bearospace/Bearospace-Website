import { SOURCES } from './org.js'

// The seven technical disciplines. Facts come from the Technical Programs pages of the
// current Google Site (one URL per discipline). A discipline can belong to more than one
// division: Payload Electronics is shared by Avionics and Payload.
//
// zones place a discipline on the rocket for the system map (systemMap.js).
// worksWith names a team the discipline works closely with, by the role that leads it,
// so the page always shows the current season's lead.

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
    zones: ['nose', 'fins'],
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
    zones: ['airframe'],
    source: page('internalexternal-structures'),
  },
  {
    // Avionics and Recovery work as one subteam for now (PM, 2026-11-10); airbrakes join later
    slug: 'avionics-recovery',
    name: 'Avionics & Recovery',
    divisionIds: ['avionics-recovery'],
    primaryDivisionId: 'avionics-recovery',
    summary: 'Flight computers, sensors, and telemetry, and the parachutes that bring the rocket home.',
    lede: 'One subteam with two halves that work hand in hand: Avionics builds the rocket’s electronics, and Recovery designs the parachutes those electronics deploy.',
    // One subteam card, two tabs on its page (content review, 2026-11-10). The page shows
    // each part's lists instead of the subteam-wide ones; roles say which part they lead
    // with `focus`. "Not part of" lists draw the line between the halves and neighbours.
    responsibilities: [],
    work: [],
    tools: [],
    skills: [],
    parts: [
      {
        id: 'avionics',
        name: 'Avionics',
        summary:
          "The rocket's nervous system: flight computers, sensors, telemetry, power distribution, and the electronics that fire recovery events. Members design circuit boards, write embedded code, and test it on the bench before it ever flies.",
        does: [
          'Sensors, flight computers, and telemetry systems',
          'Power distribution and deployment electronics',
          'Real-time flight data for payload operation and recovery',
        ],
        doesNot: [
          'Sizing, packing, and testing the parachutes (Recovery)',
          "The payload's own electronics and code (Payload Electronics and Payload Software)",
        ],
        work: ['Flight computer integration', 'Sensor networks', 'Telemetry systems', 'Power management', 'Data acquisition systems', 'Recovery electronics'],
        skills: ['PCB design', 'Embedded programming', 'Sensor integration', 'Electrical testing', 'Data systems engineering'],
        source: page('electronics'),
      },
      {
        id: 'recovery',
        name: 'Recovery',
        summary:
          "Recovery brings the rocket and payload home safely with a dual-deployment system: a drogue parachute, then a main parachute. It's one of the most safety-critical jobs on the team and a real introduction to reliability engineering.",
        does: [
          'Dual-deployment recovery with drogue and main parachutes',
          'Deployment mechanisms that work reliably under extreme conditions',
          'Descent-rate, black-powder charge, and shear-pin calculations; deployment sequencing',
        ],
        doesNot: [
          'Designing the flight computers that fire the charges (Avionics)',
          'Building the airframe and couplers around the parachute bays (Structures)',
        ],
        work: [
          'Drogue deployment systems',
          'Main parachute systems',
          'Avionics bay integration',
          'Black powder testing',
          'Recovery validation campaigns',
          'Flight readiness verification',
        ],
        skills: ['Recovery system design', 'Reliability engineering', 'Flight testing', 'Data analysis', 'Systems validation'],
        source: page('recovery-systems'),
      },
    ],
    zones: ['avionics-recovery'],
    source: `${page('electronics')} ; ${page('recovery-systems')}`,
  },
  {
    slug: 'payload-electronics',
    name: 'Payload Electronics',
    divisionIds: ['payload'],
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
    zones: ['payload'],
    worksWith: [
      {
        team: 'Payload Software',
        roleTitle: 'Payload Software Lead',
      },
    ],
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
    zones: ['payload'],
    source: page('payload-development'),
  },
  {
    // Draft written from what the site already says about payload software; Juan Ventura-Romero
    // (Payload Software Lead) to confirm (docs/CONTENT-CHECKLIST.md)
    slug: 'payload-software',
    name: 'Payload Software',
    divisionIds: ['payload'],
    primaryDivisionId: 'payload',
    summary: "The code behind the payload's autonomous mechanisms.",
    lede:
      "Payload Software writes the code that lets the payload act on its own: reading its sensors, making decisions, and driving the motors and mechanisms that carry out each year's mission. It works closely with Payload Electronics and Payload Development, and every change is tested on the bench and in the field before it flies.",
    responsibilities: [
      "Software for the payload's autonomous functions",
      'Control of payload motors and mechanisms',
      'Testing payload software on the bench and in the field',
    ],
    work: ['Embedded software for the payload', 'Sensor data processing', 'Motor and mechanism control', 'Mission autonomy logic', 'Software testing and simulation'],
    tools: [],
    skills: ['Embedded programming', 'Control systems', 'Software testing', 'Systems integration'],
    zones: ['payload'],
    worksWith: [{ team: 'Payload Electronics', roleTitle: 'Payload Electronics Lead' }],
    source: SOURCES.juan,
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
    zones: ['ground'],
    source: page('safety-operations'),
  },
]
