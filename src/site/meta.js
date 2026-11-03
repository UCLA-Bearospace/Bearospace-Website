// Page titles, descriptions, and breadcrumbs for every URL, plus the full list of
// URLs. Plain JS so the browser (RouteMeta), the prerender script, and tests share it.

import {
  disciplines,
  getDiscipline,
  getProfile,
  getProject,
  org,
  profilePeople,
  publishedProjects,
  rolesFor,
  rosterSeasons,
  seasonLabel,
} from '../content/index.js'

const SITE = org.name
const HOME = { label: 'Home', path: '/' }

const STATIC = {
  '/': {
    title: `${SITE} — ${org.tagline}`,
    description: `${org.shortName} is ${org.tagline}: students who design, build, and fly high-power rockets as the technical project of AISES at UCLA.`,
    crumbs: [],
  },
  '/about': {
    label: 'About',
    description: 'How Bearospace works: a student-led aerospace program, the full engineering lifecycle, and our roots in AISES at UCLA.',
  },
  '/engineering': {
    label: 'Engineering',
    description: 'One rocket, seven disciplines, four divisions: aerodynamics, structures, recovery, avionics, payload, and safety & operations.',
  },
  '/projects': { label: 'Projects', description: 'Rockets and payloads Bearospace has designed, built, tested, and flown.' },
  '/competitions': {
    label: 'Competitions',
    description: 'Bearospace at First Nations Launch and NASA Student Launch: what each competition asks, and our results season by season.',
  },
  '/history': { label: 'History', description: 'Seasons, rockets, teams, and results — the documented history of rocketry at UCLA AISES.' },
  '/team': { label: 'Team', description: `The ${seasonLabel(org.currentSeason)} Bearospace leadership team and past seasons.` },
  '/gallery': { label: 'Gallery', description: 'Photos from Bearospace launch days, lab sessions, and team trips.' },
  '/sponsors': { label: 'Sponsors', description: 'The organizations that support Bearospace, and how to partner with the team.' },
  '/join': {
    label: 'Join & contact',
    description: 'How to join Bearospace, where to find us, and how to reach the team about membership, sponsorship, or anything else.',
  },
}

const page = (path, { label, description, parent = HOME, title, noindex = false }) => ({
  path,
  title: title ?? `${label} · ${SITE}`,
  description,
  crumbs: [...(parent === HOME ? [HOME] : [HOME, parent]), { label, path }],
  noindex,
})

export const notFound = (path) => ({
  path,
  title: `Lost signal · ${SITE}`,
  description: 'This page could not be found.',
  crumbs: [HOME, { label: 'Not found', path }],
  notFound: true,
  noindex: true,
})

/** Metadata for any pathname; unknown paths get the not-found entry. */
export function getMeta(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (path === '/') return { path, ...STATIC['/'] }
  if (STATIC[path]) return page(path, STATIC[path])

  const [, section, slug, extra] = path.split('/')
  const parent = { label: STATIC[`/${section}`]?.label, path: `/${section}` }

  if (section === 'engineering' && slug && !extra) {
    const d = getDiscipline(slug)
    if (d) return page(path, { label: d.name, description: `${d.name} at Bearospace: ${d.summary}`, parent })
  }
  if (section === 'projects' && slug && !extra) {
    const p = getProject(slug)
    if (p) return page(path, { label: `${p.title} (${seasonLabel(p.season)})`, description: p.summary, parent })
  }
  if (section === 'team' && slug === 'season' && extra && rosterSeasons().includes(extra)) {
    return page(path, {
      label: `${seasonLabel(extra)} team`,
      description: `The Bearospace team in the ${seasonLabel(extra)} season.`,
      parent,
    })
  }
  if (section === 'team' && slug && !extra) {
    const person = getProfile(slug)
    if (person) {
      const [latest] = rolesFor(slug)
      const role = latest ? `${latest.title}, ${seasonLabel(latest.season)}` : 'Bearospace member'
      return page(path, { label: person.name, description: `${person.name} — ${role}, Bearospace at UCLA.`, parent })
    }
  }
  return notFound(path)
}

/** Every URL the site serves, for prerendering, the sitemap, and tests. */
export function allPaths() {
  return [
    ...Object.keys(STATIC),
    ...disciplines.map((d) => `/engineering/${d.slug}`),
    ...publishedProjects().map((p) => `/projects/${p.slug}`),
    ...rosterSeasons()
      .filter((s) => s !== org.currentSeason)
      .map((s) => `/team/season/${s}`),
    ...profilePeople().map((p) => `/team/${p.slug}`),
  ]
}
