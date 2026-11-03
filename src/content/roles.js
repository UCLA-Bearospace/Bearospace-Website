import { SOURCES } from './org.js'

// What each person did, season by season. Add rows for a new season; never edit old ones.
// group: one of the ids in `groups`; order: position within the group (lower first).
// publish: false hides a row until it is confirmed (default: shown).

export const groups = [
  { id: 'management', label: 'Management' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'payload', label: 'Payload' },
  { id: 'avionics', label: 'Avionics' },
  { id: 'challenge', label: 'Challenge' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'safety-operations', label: 'Safety & Operations' },
  { id: 'advisors', label: 'Advisors and mentors' },
]

const role = (personSlug, season, title, group, order, extra = {}) => ({
  personSlug,
  season,
  title,
  group,
  order,
  ...extra,
})

const S26 = { source: SOURCES.siteTeam }
const S25 = { source: SOURCES.oldSiteContact }

export const roles = [
  // 2026–27
  role('emmanuel-jaimes', '2026-27', 'Project Manager', 'management', 1, S26),
  role('bianca-vasquez', '2026-27', 'Project Manager', 'management', 2, S26),
  role('noah-hernandez', '2026-27', 'Vice Project Manager', 'management', 3, S26),
  role('alexander-astorga', '2026-27', 'Aerodynamics Director', 'vehicle', 1, { disciplineSlug: 'aerodynamics', ...S26 }),
  role('joel-venegas', '2026-27', 'Structures & Recovery Director', 'vehicle', 2, { disciplineSlug: 'structures', also: ['recovery'], ...S26 }),
  role('azad-aghdam', '2026-27', 'Aerodynamics Lead', 'vehicle', 3, { disciplineSlug: 'aerodynamics', ...S26 }),
  role('jonathan-mendez-aguilar', '2026-27', 'Structures Lead', 'vehicle', 4, { disciplineSlug: 'structures', ...S26 }),
  role('brian-sierra', '2026-27', 'Structures Lead', 'vehicle', 5, { disciplineSlug: 'structures', ...S26 }),
  role('daniel-montano', '2026-27', 'Structures Lead', 'vehicle', 6, { disciplineSlug: 'structures', ...S26 }),
  role('jonathan-nguyen', '2026-27', 'Recovery Lead', 'vehicle', 7, { disciplineSlug: 'recovery', ...S26 }),
  role('natalie-lopez', '2026-27', 'Payload Director', 'payload', 1, { disciplineSlug: 'payload', ...S26 }),
  role('brandon-aguilar', '2026-27', 'Payload Lead', 'payload', 2, { disciplineSlug: 'payload', ...S26 }),
  role('alan-alfaro', '2026-27', 'Payload Lead', 'payload', 3, { disciplineSlug: 'payload', ...S26 }),
  // Not yet on the official roster (checklist C9)
  role('juan-ventura-romero', '2026-27', 'Payload Software Lead', 'payload', 4, { disciplineSlug: 'payload', source: SOURCES.juan }),
  role('nicholas-equihua', '2026-27', 'Payload Electronics Lead', 'payload', 5, { disciplineSlug: 'payload-electronics', ...S26 }),
  role('angel-iglesias', '2026-27', 'Avionics Lead', 'avionics', 2, { disciplineSlug: 'avionics', ...S26 }),

  // 2025–26 (titles as published)
  role('isrrael-sumano', '2025-26', 'Project Manager', 'management', 1, S25),
  role('emmanuel-jaimes', '2025-26', 'Project Manager', 'management', 2, S25),
  role('josephine-rivera-hoagland', '2025-26', 'Public Relations Officer', 'management', 3, S25),
  role('noah-tran', '2025-26', 'Structures and Recovery', 'vehicle', 1, S25),
  role('azad-aghdam', '2025-26', 'Structures and Recovery', 'vehicle', 2, S25),
  role('joel-venegas', '2025-26', 'Structures and Recovery', 'vehicle', 3, S25),
  role('eirvin-rubio', '2025-26', 'Avionics', 'avionics', 1, S25),
  role('dereck-rubio', '2025-26', 'Avionics', 'avionics', 2, S25),
  role('wyatt-brown', '2025-26', 'Avionics', 'avionics', 3, S25),
  role('kenneth-fambro', '2025-26', 'Avionics', 'avionics', 4, S25),
  role('michael-sicner', '2025-26', 'Challenge', 'challenge', 1, S25),
  role('natalie-lopez', '2025-26', 'Challenge', 'challenge', 2, S25),
  role('dario-kuro', '2025-26', 'Challenge', 'challenge', 3, S25),
  role('ronaldo-garcia', '2025-26', 'Manufacturing Lead', 'manufacturing', 1, S25),
  role('moises-sosa', '2025-26', 'Manufacturing Lead', 'manufacturing', 2, S25),
  role('daniel-montano', '2025-26', 'Manufacturing Lead', 'manufacturing', 3, S25),
  role('brian-sierra', '2025-26', 'Manufacturing Lead', 'manufacturing', 4, S25),
  role('israel-alejos', '2025-26', 'Manufacturing Lead', 'manufacturing', 5, S25),
  role('noah-hernandez', '2025-26', 'Safety Lead', 'safety-operations', 1, S25),
  role('lyzet-leyva', '2025-26', 'Safety Lead', 'safety-operations', 2, S25),

  // 2018–19 (UCLA MAE news, 2019-06-05; competition proposal, 2018-11-30)
  role('lucia-gonzalez', '2018-19', 'Co-leader', 'management', 1, { source: SOURCES.mae2019 }),
  role('ryan-rio', '2018-19', 'Co-leader', 'management', 2, { source: SOURCES.mae2019 }),
  role('audrey-pool-oneal', '2018-19', 'Advisor', 'advisors', 1, { source: SOURCES.mae2019 }),
  role('frank-nobile', '2018-19', 'Mentor', 'advisors', 2, { source: SOURCES.proposal2018 }),

  // 2013–14, as the UCLA AISES Bruin Rocketeers (UCLA Samueli Newsroom, 2014-06-09).
  // Hidden until the team confirms this is Bearospace's lineage (checklist C4).
  role('daniel-calderon', '2013-14', 'Co-director', 'management', 1, { source: SOURCES.samueli2014, publish: false }),
  role('dylan-rodarte', '2013-14', 'Co-director', 'management', 2, { source: SOURCES.samueli2014, publish: false }),
  role('audrey-pool-oneal', '2013-14', 'Faculty adviser', 'advisors', 1, { source: SOURCES.samueli2014, publish: false }),
]

/** Positions the team is recruiting for, shown as "Open position" cards. */
export const openRoles = [
  { season: '2026-27', title: 'Avionics Director', group: 'avionics', order: 1, disciplineSlug: 'avionics', source: SOURCES.siteTeam },
]
