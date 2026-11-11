import { SOURCES } from './org.js'

// People are identities only; what someone did in each season lives in roles.js.
// A slug never changes, so profile links keep working after people graduate.
//
//   headshot          path under assets-src/images/, or null
//   headshotVerified  false until the person confirms the photo is theirs (checklist C12)
//   consent           true = may have a public profile page; false = named in history only
//   links             optional { linkedin, github, site }

const person = (slug, name, extra = {}) => ({
  slug,
  name,
  headshot: null,
  headshotVerified: false,
  consent: true,
  links: {},
  ...extra,
})
const shot = (slug) => ({ headshot: `team/${slug}.png` })

export const people = [
  // 2026–27 leadership (current Google Site Team page)
  person('emmanuel-jaimes', 'Emmanuel Jaimes', { ...shot('emmanuel-jaimes'), source: SOURCES.siteTeam }),
  person('bianca-vasquez', 'Bianca Vasquez', { ...shot('bianca-vasquez'), source: SOURCES.siteTeam }),
  person('noah-hernandez', 'Noah Hernandez', { ...shot('noah-hernandez'), source: SOURCES.siteTeam }),
  person('alexander-astorga', 'Alexander Astorga', { ...shot('alexander-astorga'), source: SOURCES.siteTeam }),
  person('joel-venegas', 'Joel Venegas', { ...shot('joel-venegas'), source: SOURCES.siteTeam }),
  person('azad-aghdam', 'Azad Aghdam', { ...shot('azad-aghdam'), source: SOURCES.siteTeam }),
  person('jonathan-mendez-aguilar', 'Jonathan Mendez Aguilar', { source: SOURCES.siteTeam }),
  person('brian-sierra', 'Brian Sierra', { ...shot('brian-sierra'), source: SOURCES.siteTeam }),
  person('daniel-montano', 'Daniel Montano', { source: SOURCES.siteTeam }),
  person('jonathan-nguyen', 'Jonathan Nguyen', { ...shot('jonathan-nguyen'), source: SOURCES.siteTeam }),
  person('natalie-lopez', 'Natalie Lopez', { ...shot('natalie-lopez'), source: SOURCES.siteTeam }),
  person('brandon-aguilar', 'Brandon Aguilar', { ...shot('brandon-aguilar'), source: SOURCES.siteTeam }),
  person('alan-alfaro', 'Alan Alfaro', { ...shot('alan-alfaro'), source: SOURCES.siteTeam }),
  person('angel-iglesias', 'Angel Iglesias', { ...shot('angel-iglesias'), source: SOURCES.siteTeam }),
  person('nicholas-equihua', 'Nicholas Equihua', { ...shot('nicholas-equihua'), source: SOURCES.siteTeam }),
  person('juan-ventura-romero', 'Juan Ventura-Romero', { ...shot('juan-ventura-romero'), source: SOURCES.juan }),

  // 2025–26 team (older Google Site, "THIS IS 2025-2026 BEAROSPACE"); spellings as published
  person('isrrael-sumano', 'Isrrael Sumano', { source: SOURCES.oldSiteContact }),
  person('josephine-rivera-hoagland', 'Josephine Rivera-Hoagland', { source: SOURCES.oldSiteContact }),
  person('noah-tran', 'Noah Tran', { source: SOURCES.oldSiteContact }),
  person('eirvin-rubio', 'Eirvin Rubio', { source: SOURCES.oldSiteContact }),
  person('dereck-rubio', 'Dereck Rubio', { source: SOURCES.oldSiteContact }),
  person('wyatt-brown', 'Wyatt Brown', { source: SOURCES.oldSiteContact }),
  person('kenneth-fambro', 'Kenneth Fambro', { source: SOURCES.oldSiteContact }),
  person('michael-sicner', 'Michael Sicner', { source: SOURCES.oldSiteContact }),
  // Surname corrected from the old site's "Kuro" (content review, 2026-11-10); /team/dario-kuro redirects here
  person('dario-kuroda', 'Dario Kuroda', { source: SOURCES.pmReview }),
  person('ronaldo-garcia', 'Ronaldo Garcia', { source: SOURCES.oldSiteContact }),
  person('moises-sosa', 'Moises Sosa', { source: SOURCES.oldSiteContact }),
  person('israel-alejos', 'Israel Alejos', { source: SOURCES.oldSiteContact }),
  person('lyzet-leyva', 'Lyzet Leyva', { source: SOURCES.oldSiteContact }),

  // Earlier teams, named in UCLA news coverage. No profile pages.
  person('lucia-gonzalez', 'Lucia Gonzalez', { consent: false, source: SOURCES.mae2019 }),
  person('ryan-rio', 'Ryan Rio', { consent: false, source: SOURCES.mae2019 }),
  person('daniel-calderon', 'Daniel Calderon', { consent: false, source: SOURCES.samueli2014 }),
  person('dylan-rodarte', 'Dylan Rodarte', { consent: false, source: SOURCES.samueli2014 }),
  person('audrey-pool-oneal', "Audrey Pool O'Neal", { consent: false, source: SOURCES.mae2019 }),
  person('frank-nobile', 'Frank Nobile', { consent: false, source: SOURCES.proposal2018 }),
]
