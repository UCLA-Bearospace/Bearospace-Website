import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { content, historyProjects } from '../../src/content/index.js'
import { destinations } from '../../src/site/destinations.js'
import { allPaths, getMeta } from '../../src/site/meta.js'
import { stageOf, timelines } from '../../src/content/competitionTimeline.js'
import { validateTimelines } from '../../scripts/validate-content.mjs'

// Guards for the project manager's content review (slice 10, 2026-11-10).

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
// Every string a record shows; sources and links are records of where a fact came from, not copy
const HIDDEN = new Set(['source', 'sources', 'sourceUrl', 'url'])
const strings = (value) =>
  typeof value === 'string'
    ? [value]
    : value && typeof value === 'object'
      ? Object.entries(value).flatMap(([k, v]) => (HIDDEN.has(k) ? [] : strings(v)))
      : []

test('our own copy does not mention AISES (historical records keep their official wording)', () => {
  // Competition records, results, and milestone titles quote official category names
  // ("AISES Launch") and stay as recorded; everything we write ourselves is checked
  const { org, divisions, disciplines, sponsors, groups, roles, people, projects, gallery } = content
  const own = [org.name, org.lede, org.mission, ...strings({ divisions, disciplines, sponsors, groups, roles, gallery })]
  own.push(...strings(people.map(({ name, bio }) => ({ name, bio }))))
  own.push(...strings(projects.map(({ title, summary, objective }) => ({ title, summary, objective }))))
  own.push(...strings(destinations))
  for (const path of allPaths()) {
    const { title, description } = getMeta(path)
    own.push(title, description)
  }
  // The official category name ("AISES Launch") is a historical record and may appear
  for (const s of own) assert.ok(!/AISES(?! Launch)/i.test(s ?? ''), s)

  // Page and shell components: no hard-coded mention
  for (const dir of ['src/pages', 'src/app', 'src/components', 'src/menu']) {
    for (const file of readdirSync(new URL(`../../${dir}`, import.meta.url))) {
      if (/\.jsx?$/.test(file)) assert.ok(!/AISES/.test(read(`${dir}/${file}`)), `${dir}/${file}`)
    }
  }
})

test('every redirect lands on a real page', () => {
  const paths = new Set(allPaths())
  const { redirects } = JSON.parse(read('vercel.json'))
  for (const { source, destination } of redirects) {
    const [path, hash] = destination.split('#')
    assert.ok(paths.has(path), `${source} → ${destination}`)
    assert.ok(!paths.has(source), `${source} is still a page of its own`)
    // History anchors are season ids (#season-2018-19)
    if (path === '/history' && hash) {
      const season = hash.replace(/^season-/, '')
      assert.ok(historyProjects(season).length > 0 || content.results.some((r) => r.season === season), destination)
    }
    // Subteam anchors open a tab (#avionics, #recovery)
    if (path.startsWith('/engineering/') && hash) {
      const d = content.disciplines.find((x) => `/engineering/${x.slug}` === path)
      assert.ok(d?.parts?.some((p) => p.id === hash), destination)
    }
  }
})

test('competition trackers: NASA Student Launch at its PDR, First Nations Launch planning', () => {
  assert.deepEqual(validateTimelines(timelines, content.competitions), [])
  assert.equal(stageOf('nasa-student-launch').stage.id, 'pdr')
  assert.deepEqual(
    timelines['nasa-student-launch'].stages.map((s) => s.short),
    ['Proposal', 'Selected', 'PDR', 'CDR', 'FRR', 'Launch', 'PLAR'],
  )
  assert.equal(stageOf('first-nations-launch').index, 0)
  assert.equal(stageOf('first-nations-launch').stage.id, 'planning')
})

test('a tracker must point at a real stage', () => {
  const broken = structuredClone(timelines)
  broken['nasa-student-launch'].current = 'cdrr'
  broken['moon-race'] = { ...broken['first-nations-launch'] }
  const errors = validateTimelines(broken, content.competitions).join('\n')
  assert.match(errors, /"nasa-student-launch" › current: "cdrr" is not one of its stages/)
  assert.match(errors, /"moon-race" › key: is not in competitions\.js/)
})
