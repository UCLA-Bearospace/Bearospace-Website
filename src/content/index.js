// One import point for all content, plus the lookups pages need. Plain JS (no JSX or
// Vite-only imports) so Node scripts can load it too: validation, prerender, tests.

import { org, SOURCES } from './org.js'
import { links, contactTopics, mailto } from './links.js'
import { divisions } from './divisions.js'
import { disciplines, software } from './disciplines.js'
import { people } from './people.js'
import { roles, openRoles, groups } from './roles.js'
import { projects } from './projects.js'
import { competitions, results } from './competitions.js'
import { milestones } from './milestones.js'
import { sponsors } from './sponsors.js'
import { gallery } from './gallery.js'
import { zones } from './systemMap.js'

export {
  org,
  SOURCES,
  links,
  contactTopics,
  mailto,
  divisions,
  disciplines,
  software,
  people,
  roles,
  openRoles,
  groups,
  projects,
  competitions,
  results,
  milestones,
  sponsors,
  gallery,
  zones,
}

export const content = {
  org,
  links,
  divisions,
  disciplines,
  people,
  roles,
  openRoles,
  groups,
  projects,
  competitions,
  results,
  milestones,
  sponsors,
  gallery,
}

/** '2026-27' → '2026–27' */
export const seasonLabel = (season) => (season ? season.replace('-', '–') : '')

const bySlug = (list) => new Map(list.map((x) => [x.slug, x]))
const personMap = bySlug(people)
const disciplineMap = bySlug(disciplines)
const projectMap = bySlug(projects)
const competitionMap = bySlug(competitions)

export const getPerson = (slug) => personMap.get(slug)
export const getDiscipline = (slug) => disciplineMap.get(slug)
export const getCompetition = (slug) => competitionMap.get(slug)
export const getProject = (slug) => {
  const p = projectMap.get(slug)
  return p?.publish ? p : undefined
}
export const getDivision = (id) => divisions.find((d) => d.id === id)

export const publishedProjects = () => projects.filter((p) => p.publish)
export const publishedResults = () => results.filter((r) => r.publish)
export const publishedMilestones = () => milestones.filter((m) => m.publish)

/** A photo's address on the gallery page (/gallery?photo=<slug>): its file name. */
export const photoSlug = (photo) => photo.src.split('/').pop().replace(/\.\w+$/, '')

/** Gallery categories with at least two photos, in the order photos first use them. */
export const galleryCategories = () => {
  const counts = new Map()
  for (const g of gallery) counts.set(g.category, (counts.get(g.category) ?? 0) + 1)
  return [...counts].filter(([, n]) => n >= 2).map(([id]) => id)
}

/** People who may have a profile page. */
export const profilePeople = () => people.filter((p) => p.consent)
export const getProfile = (slug) => {
  const p = personMap.get(slug)
  return p?.consent ? p : undefined
}

export const disciplinesInDivision = (divisionId) => disciplines.filter((d) => d.divisionIds.includes(divisionId))

export const publishedRoles = () => roles.filter((r) => r.publish !== false)

/** Seasons that have a roster, newest first. */
export const rosterSeasons = () => [...new Set(publishedRoles().map((r) => r.season))].sort().reverse()

/** A season's roster grouped for display: [{ group, members: [{ role, person }], open: [] }] */
export function roster(season) {
  return groups
    .map((group) => ({
      group,
      members: publishedRoles()
        .filter((r) => r.season === season && r.group === group.id)
        .sort((a, b) => a.order - b.order)
        .map((role) => ({ role, person: personMap.get(role.personSlug) })),
      open: openRoles.filter((r) => r.season === season && r.group === group.id),
    }))
    .filter((g) => g.members.length || g.open.length)
}

/** Every role a person has held, newest season first. */
export const rolesFor = (personSlug) =>
  publishedRoles()
    .filter((r) => r.personSlug === personSlug)
    .sort((a, b) => b.season.localeCompare(a.season))

/** Current-season leads for a discipline (including roles that also cover it). */
export const leadsFor = (disciplineSlug, season = org.currentSeason) =>
  publishedRoles()
    .filter((r) => r.season === season && (r.disciplineSlug === disciplineSlug || r.also?.includes(disciplineSlug)))
    .sort((a, b) => a.order - b.order)
    .map((role) => ({ role, person: personMap.get(role.personSlug) }))

/** The rocket sections a discipline works on (system map), nose to tail. */
export const zonesFor = (disciplineSlug) => {
  const ids = disciplines.find((d) => d.slug === disciplineSlug)?.zones ?? []
  return zones.filter((z) => ids.includes(z.id))
}

/** Disciplines that work on a rocket section. */
export const disciplinesInZone = (zoneId) => disciplines.filter((d) => d.zones.includes(zoneId))

/** Teams a discipline works closely with, each with whoever holds the lead role this season. */
export const worksWithFor = (disciplineSlug, season = org.currentSeason) =>
  (disciplines.find((d) => d.slug === disciplineSlug)?.worksWith ?? []).map((w) => {
    const role = publishedRoles().find((r) => r.season === season && r.title === w.roleTitle)
    return { ...w, role, person: role ? personMap.get(role.personSlug) : null }
  })

export const openRolesFor = (disciplineSlug, season = org.currentSeason) =>
  openRoles.filter((r) => r.season === season && r.disciplineSlug === disciplineSlug)

/** Projects a person contributed to, with what they did. */
export const contributionsBy = (personSlug) =>
  publishedProjects().flatMap((project) =>
    project.contributors.filter((c) => c.personSlug === personSlug).map((c) => ({ project, contribution: c.contribution })),
  )

export const projectsForDiscipline = (slug) => publishedProjects().filter((p) => p.disciplineSlugs.includes(slug))

/** Sponsors in display order; `intro` limits to the opening sequence. */
export const sponsorList = ({ intro = false } = {}) =>
  sponsors
    .filter((s) => !intro || s.showInIntro)
    .sort((a, b) => (intro ? a.introOrder - b.introOrder : a.order - b.order))
