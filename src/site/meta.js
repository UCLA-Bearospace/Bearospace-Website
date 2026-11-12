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
    description: `${org.shortName} is ${org.tagline}: students who design, build, and fly high-power rockets, and the payloads inside them.`,
    crumbs: [],
  },
  '/about': {
    label: 'About',
    description: 'How Bearospace works: a student-led aerospace program, the full engineering lifecycle, and a note from our project managers.',
  },
  '/engineering': {
    label: 'Engineering',
    description: 'One rocket, seven subteams in four divisions: aerodynamics, structures, avionics & recovery, payload development, payload electronics, payload software, and safety & operations.',
  },
  '/projects': { label: 'Projects', description: 'The designs and R&D projects Bearospace is working on now.' },
  '/competitions': {
    label: 'Competitions',
    description: 'Bearospace at NASA Student Launch and First Nations Launch: what each competition asks, and our results season by season.',
  },
  '/history': { label: 'History', description: 'Seasons, rockets, teams, and results — the documented history of Bearospace and rocketry at UCLA.' },
  '/team': { label: 'Team', description: `The ${seasonLabel(org.currentSeason)} Bearospace leadership team and past seasons.` },
  '/gallery': { label: 'Gallery', description: 'Photos from Bearospace launch days, lab sessions, and team trips.' },
  '/sponsors': { label: 'Sponsors', description: 'The organizations that support Bearospace, and how to partner with the team.' },
  '/join': {
    label: 'Join & contact',
    description: 'How to join Bearospace, where to find us, and how to reach the team about membership, sponsorship, or anything else.',
  },
}

const page = (path, { label, description, parent = HOME, title, noindex = false, jsonLd = null }) => ({
  path,
  title: title ?? `${label} · ${SITE}`,
  description,
  crumbs: [...(parent === HOME ? [HOME] : [HOME, parent]), { label, path }],
  noindex,
  jsonLd, // structured data for search engines, written into the prerendered <head>
})

/**
 * schema.org Person for a profile page. Profiles exist only for people who agreed to one
 * (consent), and the photo is left out until they confirm it is theirs (headshotVerified).
 */
function personJsonLd(person, latest, current) {
  const links = Object.values(person.links ?? {})
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    ...(latest ? { jobTitle: latest.title } : {}),
    [current ? 'memberOf' : 'alumniOf']: { '@type': 'Organization', name: SITE },
    ...(org.siteUrl ? { url: `${org.siteUrl}/team/${person.slug}` } : {}),
    ...(org.siteUrl && person.headshot && person.headshotVerified
      ? { image: `${org.siteUrl}/media/${person.headshot.replace(/.w+$/, '-640.webp')}` }
      : {}),
    ...(links.length ? { sameAs: links } : {}),
  }
}

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
      const current = latest?.season === org.currentSeason
      const role = latest ? `${latest.title}, ${seasonLabel(latest.season)}` : 'Bearospace member'
      return page(path, {
        label: person.name,
        description: `${person.name} — ${role}, Bearospace at UCLA.`,
        parent,
        jsonLd: personJsonLd(person, latest, current),
      })
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
