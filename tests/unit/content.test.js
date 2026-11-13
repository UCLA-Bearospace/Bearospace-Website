import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateContent } from '../../scripts/validate-content.mjs'
import { readFileSync } from 'node:fs'
import {
  content,
  disciplinesInDivision,
  disciplinesInZone,
  getProject,
  historyProjects,
  leadsFor,
  pastPartners,
  publishedProjects,
  publishedResults,
  roster,
  rosterSeasons,
  sponsorList,
  worksWithFor,
  zones,
  zonesFor,
} from '../../src/content/index.js'
import { FINS, NOSE_END, OUTLINE } from '../../src/content/systemMap.js'

// A deep copy we can break on purpose
const copy = () => structuredClone(content)

test('the real content is valid', () => {
  assert.deepEqual(validateContent(content), [])
})

test('a broken person reference names the file, entry, and field', () => {
  const c = copy()
  c.projects[0].contributors[1].personSlug = 'jon-n'
  const errors = validateContent(c)
  assert.equal(errors.length, 1)
  assert.match(errors[0], /^projects\.js › "2018-19-fnl-rocket" › contributors\[1\]\.personSlug: "jon-n" is not in people\.js$/)
})

test('a missing image file is reported', () => {
  const c = copy()
  c.gallery[0].src = 'gallery/nope.jpg'
  assert.match(validateContent(c).join('\n'), /gallery\.js › "gallery\/nope\.jpg" › src: file not found/)
})

test('unconfirmed results cannot be published', () => {
  const c = copy()
  const tribal = c.results.find((r) => r.category === 'Tribal Category')
  tribal.publish = true
  assert.match(validateContent(c).join('\n'), /only confirmed results can be published/)
})

test('a bad season format is caught', () => {
  const c = copy()
  c.roles[0].season = '2026-2027'
  assert.match(validateContent(c).join('\n'), /roles\.js › .* › season: season must look like 2026-27/)
})

test('duplicate slugs are caught', () => {
  const c = copy()
  c.people.push({ ...c.people[0] })
  assert.match(validateContent(c).join('\n'), /"emmanuel-jaimes" is used twice/)
})

test('a sponsor shown in the intro needs a logo', () => {
  const c = copy()
  c.sponsors[0].logo = null
  assert.match(validateContent(c).join('\n'), /sponsors\.js › "anduril" › showInIntro: sponsors shown in the intro need a logo/)
})

test('seven subteams: Avionics & Recovery combined, Payload Software its own', () => {
  assert.equal(content.disciplines.length, 7)
  const slugs = content.disciplines.map((d) => d.slug)
  assert.ok(slugs.includes('avionics-recovery') && slugs.includes('payload-software'))
  assert.ok(!slugs.includes('avionics') && !slugs.includes('recovery'))
  // One section on the map too: the main parachute, avionics, and drogue bays
  assert.deepEqual(
    zonesFor('avionics-recovery').map((z) => z.id),
    ['avionics-recovery'],
  )
  assert.deepEqual(
    content.divisions.map((d) => d.id),
    ['vehicle', 'avionics-recovery', 'payload', 'safety-operations'],
  )
  // Payload Electronics belongs to the Payload division only (content review, 2026-11-10)
  assert.deepEqual(content.disciplines.find((d) => d.slug === 'payload-electronics').divisionIds, ['payload'])
  assert.deepEqual(
    disciplinesInDivision('payload').map((d) => d.slug),
    ['payload-electronics', 'payload', 'payload-software'],
  )
})

test('the current roster groups people under Avionics & Recovery, with no open roles', () => {
  const groups = roster('2026-27')
  const ar = groups.find((g) => g.group.id === 'avionics-recovery')
  assert.deepEqual(
    ar.members.map((m) => m.person.slug),
    ['angel-iglesias', 'jonathan-nguyen', 'joel-venegas'],
  )
  assert.ok(groups.every((g) => g.open.length === 0))
  assert.ok(leadsFor('payload-software').some(({ person, role }) => person.slug === 'juan-ventura-romero' && role.title === 'Payload Software Lead'))
})

test('Avionics & Recovery is one subteam with two parts, each led by its own people', () => {
  const d = content.disciplines.find((x) => x.slug === 'avionics-recovery')
  assert.deepEqual(
    d.parts.map((p) => p.id),
    ['avionics', 'recovery'],
  )
  for (const p of d.parts) assert.ok(p.does.length && p.doesNot.length && p.skills.length, p.id)
  const focus = (id) =>
    leadsFor('avionics-recovery')
      .filter(({ role }) => role.focus === id)
      .map(({ person }) => person.slug)
  assert.deepEqual(focus('avionics'), ['angel-iglesias'])
  assert.deepEqual(focus('recovery'), ['joel-venegas', 'jonathan-nguyen'])
})

test('a role that spans two teams is listed under both roster groups', () => {
  const groups = roster('2026-27')
  const slugs = (id) => groups.find((g) => g.group.id === id).members.map((m) => m.person.slug)
  assert.ok(slugs('vehicle').includes('joel-venegas'))
  // Third under Avionics & Recovery, after the two leads (alsoGroup.order)
  assert.deepEqual(slugs('avionics-recovery'), ['angel-iglesias', 'jonathan-nguyen', 'joel-venegas'])
})

test('a subteam needs lists or parts, and a focus must name a real part', () => {
  const c = copy()
  const safety = c.disciplines.find((d) => d.slug === 'safety-operations')
  safety.responsibilities = []
  c.roles.find((r) => r.personSlug === 'angel-iglesias' && r.season === '2026-27').focus = 'propulsion'
  const errors = validateContent(c).join('\n')
  assert.match(errors, /"safety-operations" › responsibilities: list at least one/)
  assert.match(errors, /focus: no subteam this role covers has a part "propulsion"/)
})

test('a past partner is listed by name only, never in the intro or the strip', () => {
  const mach = pastPartners().find((s) => s.id === 'mach-industries')
  assert.ok(mach)
  assert.equal(mach.logo, null)
  assert.ok(!sponsorList().some((s) => s.id === 'mach-industries'))
  assert.ok(!sponsorList({ intro: true }).some((s) => s.id === 'mach-industries'))
})

test('the 2018–19 rocket lives on History, not Projects', () => {
  assert.equal(getProject('2018-19-fnl-rocket'), undefined)
  assert.ok(!publishedProjects().some((p) => p.slug === '2018-19-fnl-rocket'))
  assert.deepEqual(
    historyProjects('2018-19').map((p) => p.slug),
    ['2018-19-fnl-rocket'],
  )
})

test('unconfirmed lineage stays hidden', () => {
  assert.ok(!rosterSeasons().includes('2013-14'))
  assert.ok(publishedResults().every((r) => r.confidence === 'confirmed'))
})

test('sponsors come back in intro order for the opening sequence', () => {
  assert.deepEqual(
    sponsorList({ intro: true }).map((s) => s.id),
    ['anduril', 'sendcutsend', 'ucla-samueli'],
  )
})

test('every discipline sits somewhere on the system map', () => {
  for (const d of content.disciplines) assert.ok(zonesFor(d.slug).length > 0, d.slug)
  // Every section of the map belongs to at least one discipline
  for (const z of zones) assert.ok(disciplinesInZone(z.id).length > 0, z.id)
})

test('the system map matches the rocket model', () => {
  const meta = JSON.parse(readFileSync(new URL('../../src/generated/rocket.meta.json', import.meta.url), 'utf8'))
  const close = (a, b) => Math.abs(a - b) < 0.001
  assert.ok(close(NOSE_END, meta.noseLengthM / meta.lengthM), `nose ends at ${meta.noseLengthM / meta.lengthM}`)
  assert.ok(close(FINS[0], 1 - meta.fin.rootToM / meta.lengthM))
  assert.ok(close(FINS[1], 1 - meta.fin.rootFromM / meta.lengthM))
  // The outline the map draws is a copy of the model's measurements
  assert.equal(OUTLINE.lengthM, meta.lengthM)
  assert.equal(OUTLINE.bodyDiameterM, meta.bodyDiameterM)
  assert.equal(OUTLINE.finSpanM, meta.finSpanM)
  assert.deepEqual(OUTLINE.fin, meta.fin)
  const nose = meta.profile.filter(([r]) => r < meta.bodyDiameterM / 2 - 0.0001).map(([r, y]) => [r, +(meta.lengthM - y).toFixed(4)])
  assert.deepEqual(OUTLINE.nose, nose)
  // Sections stay on the rocket and in order; only the model-derived ones are exact
  for (const z of zones) {
    for (const [from, to] of z.segments) assert.ok(from >= 0 && to <= 1 && from < to, z.id)
    if (['payload', 'avionics-recovery'].includes(z.id)) assert.equal(z.approximate, true, z.id)
  }
})

test('Payload Electronics works with Payload Software, led by this season’s lead', () => {
  const [w] = worksWithFor('payload-electronics')
  assert.equal(w.team, 'Payload Software')
  assert.equal(w.person.slug, 'juan-ventura-romero')
})

test('a discipline must name real rocket sections and real roles', () => {
  const c = copy()
  c.disciplines[0].zones = ['engine-room']
  c.disciplines.find((d) => d.slug === 'payload-electronics').worksWith = [{ team: 'Payload Software', roleTitle: 'Chief Wizard' }]
  const errors = validateContent(c).join('\n')
  assert.match(errors, /disciplines\.js › "aerodynamics" › zones\[0\]: Invalid option/)
  assert.match(errors, /disciplines\.js › "payload-electronics" › worksWith\[0\]\.roleTitle: no role in roles\.js is titled "Chief Wizard"/)
})
