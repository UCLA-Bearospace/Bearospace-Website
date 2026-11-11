// Checks every content file before each build (`npm run validate`, also run by `prebuild`).
// Errors name the file, the entry, and the field, e.g.
//   projects.js › "2018-19-fnl-rocket" › contributors[2].personSlug: "jon-n" is not in people.js
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { orgSchema, schemas } from './schema.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

// Which file each collection lives in, for error messages
const FILES = {
  divisions: 'divisions.js',
  disciplines: 'disciplines.js',
  people: 'people.js',
  roles: 'roles.js',
  openRoles: 'roles.js (openRoles)',
  groups: 'roles.js (groups)',
  projects: 'projects.js',
  competitions: 'competitions.js',
  results: 'competitions.js (results)',
  milestones: 'milestones.js',
  sponsors: 'sponsors.js',
  gallery: 'gallery.js',
}

const nameOf = (collection, item, i) =>
  item?.slug ?? item?.id ?? (item?.personSlug && `${item.personSlug} ${item.season}`) ??
  (item?.competitionSlug && `${item.season} ${item.category}`) ?? item?.src ?? item?.title ?? `#${i + 1}`

const fieldPath = (path) => path.map((p, i) => (typeof p === 'number' ? `[${p}]` : i ? `.${p}` : p)).join('')

/**
 * @param content  the `content` export of src/content/index.js (or a test fixture)
 * @param options  { mediaRoot } where image paths resolve; null skips file checks
 * @returns string[] errors (empty when valid)
 */
export function validateContent(content, { mediaRoot = join(ROOT, 'assets-src', 'images') } = {}) {
  const errors = []
  const report = (collection, item, i, field, message) =>
    errors.push(`${FILES[collection] ?? `${collection}.js`} › "${nameOf(collection, item, i)}" › ${field}: ${message}`)

  // Shapes
  const org = orgSchema.safeParse(content.org)
  if (!org.success) for (const issue of org.error.issues) errors.push(`org.js › ${fieldPath(issue.path)}: ${issue.message}`)
  // Starting a new season (CONTENT.md): add its roles, then point currentSeason at it
  const season = content.org?.currentSeason
  if (season && !(content.roles ?? []).some((r) => r.season === season && r.publish !== false))
    errors.push(`org.js › currentSeason: "${season}" has no published roles in roles.js, so /team would be empty`)
  for (const [collection, schema] of Object.entries(schemas)) {
    const list = content[collection] ?? []
    list.forEach((item, i) => {
      const r = schema.safeParse(item)
      if (!r.success) for (const issue of r.error.issues) report(collection, item, i, fieldPath(issue.path) || '(entry)', issue.message)
    })
  }

  // Unique keys
  const unique = (collection, key) => {
    const seen = new Set()
    ;(content[collection] ?? []).forEach((item, i) => {
      if (seen.has(item[key])) report(collection, item, i, key, `"${item[key]}" is used twice`)
      seen.add(item[key])
    })
  }
  unique('people', 'slug')
  unique('disciplines', 'slug')
  unique('projects', 'slug')
  unique('competitions', 'slug')
  unique('divisions', 'id')
  unique('sponsors', 'id')
  unique('groups', 'id')
  unique('gallery', 'src')

  // References
  const has = (collection, key) => new Set((content[collection] ?? []).map((x) => x[key]))
  const people = has('people', 'slug')
  const disciplines = has('disciplines', 'slug')
  const divisions = has('divisions', 'id')
  const projects = has('projects', 'slug')
  const competitions = has('competitions', 'slug')
  const groups = has('groups', 'id')
  const ref = (collection, item, i, field, value, set, target) => {
    if (value !== undefined && value !== null && !set.has(value)) report(collection, item, i, field, `"${value}" is not in ${target}`)
  }
  const media = (collection, item, i, field, path) => {
    if (path && mediaRoot && !existsSync(join(mediaRoot, path))) report(collection, item, i, field, `file not found: assets-src/images/${path}`)
  }

  content.disciplines?.forEach((d, i) => {
    d.divisionIds?.forEach((id, k) => ref('disciplines', d, i, `divisionIds[${k}]`, id, divisions, 'divisions.js'))
    if (d.divisionIds && !d.divisionIds.includes(d.primaryDivisionId))
      report('disciplines', d, i, 'primaryDivisionId', 'must be one of divisionIds')
    if (!d.parts) {
      if (!d.responsibilities?.length) report('disciplines', d, i, 'responsibilities', 'list at least one (or give the subteam parts)')
      if (!d.skills?.length) report('disciplines', d, i, 'skills', 'list at least one (or give the subteam parts)')
    }
    d.worksWith?.forEach((w, k) => {
      if (!content.roles?.some((r) => r.title === w.roleTitle))
        report('disciplines', d, i, `worksWith[${k}].roleTitle`, `no role in roles.js is titled "${w.roleTitle}"`)
    })
  })
  content.people?.forEach((p, i) => media('people', p, i, 'headshot', p.headshot))
  for (const collection of ['roles', 'openRoles']) {
    content[collection]?.forEach((r, i) => {
      if (collection === 'roles') ref(collection, r, i, 'personSlug', r.personSlug, people, 'people.js')
      ref(collection, r, i, 'group', r.group, groups, 'roles.js groups')
      ref(collection, r, i, 'disciplineSlug', r.disciplineSlug, disciplines, 'disciplines.js')
      r.also?.forEach((s, k) => ref(collection, r, i, `also[${k}]`, s, disciplines, 'disciplines.js'))
      if (r.alsoGroup) ref(collection, r, i, 'alsoGroup.id', r.alsoGroup.id, groups, 'roles.js groups')
      if (r.focus) {
        const covered = [r.disciplineSlug, ...(r.also ?? [])].map((s) => content.disciplines?.find((d) => d.slug === s))
        if (!covered.some((d) => d?.parts?.some((p) => p.id === r.focus)))
          report(collection, r, i, 'focus', `no subteam this role covers has a part "${r.focus}"`)
      }
    })
  }
  content.projects?.forEach((p, i) => {
    ref('projects', p, i, 'competitionSlug', p.competitionSlug, competitions, 'competitions.js')
    p.disciplineSlugs?.forEach((s, k) => ref('projects', p, i, `disciplineSlugs[${k}]`, s, disciplines, 'disciplines.js'))
    p.contributors?.forEach((c, k) => ref('projects', p, i, `contributors[${k}].personSlug`, c.personSlug, people, 'people.js'))
    p.media?.forEach((m, k) => media('projects', p, i, `media[${k}].src`, m.src))
  })
  content.results?.forEach((r, i) => {
    ref('results', r, i, 'competitionSlug', r.competitionSlug, competitions, 'competitions.js')
    ref('results', r, i, 'projectSlug', r.projectSlug, projects, 'projects.js')
  })
  content.milestones?.forEach((m, i) => ref('milestones', m, i, 'projectSlug', m.projectSlug, projects, 'projects.js'))
  content.sponsors?.forEach((s, i) => {
    media('sponsors', s, i, 'logo.onDark', s.logo?.onDark)
    media('sponsors', s, i, 'logo.onLight', s.logo?.onLight)
  })
  content.gallery?.forEach((g, i) => {
    media('gallery', g, i, 'src', g.src)
    // The file name is the photo's address (/gallery?photo=<name>), so it must be unique too
    const fileName = (src) => src?.split('/').pop().replace(/\.\w+$/, '')
    const name = fileName(g.src)
    if (content.gallery.findIndex((o) => fileName(o.src) === name) !== i)
      report('gallery', g, i, 'src', `another photo is also named "${name}"`)
    g.people?.forEach((s, k) => ref('gallery', g, i, `people[${k}]`, s, people, 'people.js'))
  })

  return errors
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { content } = await import('../src/content/index.js')
  const errors = validateContent(content)
  if (errors.length) {
    console.error(`Content has ${errors.length} problem(s):\n  ` + errors.join('\n  '))
    console.error('\nSee CONTENT.md for how each file is laid out.')
    process.exit(1)
  }
  const counts = Object.entries(content)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => `${v.length} ${k}`)
    .join(', ')
  console.log(`Content OK: ${counts}`)
}
