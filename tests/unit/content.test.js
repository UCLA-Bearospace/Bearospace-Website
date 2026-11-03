import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateContent } from '../../scripts/validate-content.mjs'
import { content, leadsFor, roster, rosterSeasons, publishedResults, sponsorList } from '../../src/content/index.js'

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

test('Payload Electronics is one discipline shared by two divisions', () => {
  const pe = content.disciplines.filter((d) => d.slug === 'payload-electronics')
  assert.equal(pe.length, 1)
  assert.deepEqual(pe[0].divisionIds.sort(), ['avionics', 'payload'])
})

test('the current roster groups people and shows the open Avionics Director role', () => {
  const groups = roster('2026-27')
  const avionics = groups.find((g) => g.group.id === 'avionics')
  assert.equal(avionics.open[0].title, 'Avionics Director')
  assert.ok(leadsFor('payload').some(({ person, role }) => person.slug === 'juan-ventura-romero' && role.title === 'Payload Software Lead'))
})

test('unconfirmed lineage stays hidden', () => {
  assert.ok(!rosterSeasons().includes('2013-14'))
  assert.ok(publishedResults().every((r) => r.confidence === 'confirmed'))
})

test('sponsors come back in intro order for the opening sequence', () => {
  assert.deepEqual(
    sponsorList({ intro: true }).map((s) => s.id),
    ['anduril', 'ucla-samueli'],
  )
})
