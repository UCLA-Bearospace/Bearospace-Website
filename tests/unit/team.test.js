import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateContent } from '../../scripts/validate-content.mjs'
import { content, getProfile, profilePeople, rolesFor, rosterSeasons } from '../../src/content/index.js'
import { allPaths, getMeta } from '../../src/site/meta.js'

// People and seasons (slice 6).

const copy = () => structuredClone(content)

test('starting a new season takes role rows and one org change, no person edits', () => {
  const c = copy()
  const people = JSON.stringify(c.people)
  c.roles.push({ personSlug: 'juan-ventura-romero', season: '2027-28', title: 'Payload Director', group: 'payload', order: 1, disciplineSlug: 'payload', source: 'test' })
  c.org.currentSeason = '2027-28'
  assert.deepEqual(validateContent(c), [])
  assert.equal(JSON.stringify(c.people), people)
})

test('a current season with no roles is caught (the team page would be empty)', () => {
  const c = copy()
  c.org.currentSeason = '2027-28'
  assert.match(validateContent(c).join('\n'), /org\.js › currentSeason: "2027-28" has no published roles/)
})

test('role history runs newest season first', () => {
  const seasons = rolesFor('emmanuel-jaimes').map((r) => r.season)
  assert.deepEqual(seasons, [...seasons].sort().reverse())
  assert.ok(seasons.includes('2026-27') && seasons.includes('2025-26'))
})

test('people without consent are named in rosters but get no profile page', () => {
  assert.equal(getProfile('lucia-gonzalez'), undefined)
  assert.ok(!allPaths().includes('/team/lucia-gonzalez'))
  assert.ok(!profilePeople().some((p) => p.slug === 'lucia-gonzalez'))
  // The 2018–19 roster that named them is hidden for now (checklist C22)
  assert.ok(!rosterSeasons().includes('2018-19'))
  assert.equal(getMeta('/team/lucia-gonzalez').notFound, true)
})

test('profiles describe the person for search engines, without unconfirmed photos', () => {
  const juan = getMeta('/team/juan-ventura-romero').jsonLd
  assert.equal(juan['@type'], 'Person')
  assert.equal(juan.jobTitle, 'Payload Software Lead')
  assert.equal(juan.memberOf.name, 'Bearospace at UCLA')
  assert.equal(juan.image, undefined) // headshotVerified is still false (checklist C12)

  const alum = getMeta('/team/isrrael-sumano').jsonLd
  assert.equal(alum.alumniOf.name, 'Bearospace at UCLA')
  assert.equal(alum.memberOf, undefined)
})

test('gaps in the season record are found from the data', async () => {
  const { gaps, nextSeason } = await import('../../src/lib/seasons.js')
  assert.equal(nextSeason('2018-19'), '2019-20')
  assert.equal(nextSeason('2099-00'), '2100-01')
  assert.deepEqual(gaps(['2016-17', '2017-18', '2018-19', '2023-24', '2024-25']), [['2019-20', '2022-23']])
  assert.deepEqual(gaps(['2016-17', '2018-19', '2020-21']), [
    ['2017-18', '2017-18'],
    ['2019-20', '2019-20'],
  ])
  assert.deepEqual(gaps(['2026-27']), [])
})
