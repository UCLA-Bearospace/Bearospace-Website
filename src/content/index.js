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
