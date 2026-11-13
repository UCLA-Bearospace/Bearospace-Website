import { test } from 'node:test'
import assert from 'node:assert/strict'
import { content, rolesFor } from '../../src/content/index.js'
import { careerOrgs, careers, careersFor, describePosition } from '../../src/content/careers.js'
import { validateCareers } from '../../scripts/validate-content.mjs'

// Where members have gone (Juan, 2026-11-12), and Emmanuel's two 2025–26 roles.

test('the careers list is valid and names eight members', () => {
  assert.deepEqual(validateCareers(careers, content.people), [])
  assert.equal(careers.length, 8)
  assert.deepEqual(careerOrgs(), ['PPG', 'Northrop Grumman', 'Mortenson', 'Carlton Forge Works', 'Lockheed Martin', 'NASA', 'Avibank'])
})

test('positions read plainly, with repeat internships and parent companies', () => {
  assert.deepEqual(careersFor('dereck-rubio').map(describePosition), ['Intern · Northrop Grumman (twice)', 'Full-time · Mortenson'])
  assert.deepEqual(careersFor('noah-tran').map(describePosition), ['Intern · Carlton Forge Works (Precision Castparts Corp.)'])
  // A confirmed job title replaces the generic "Intern" (checklist C27)
  assert.equal(describePosition({ kind: 'internship', org: 'NASA', title: 'Payload Systems Intern' }), 'Payload Systems Intern · NASA')
  assert.deepEqual(careersFor('juan-ventura-romero'), [])
})

test('mistakes in the careers list are caught', () => {
  const broken = structuredClone(careers)
  broken[0].personSlug = 'ronaldo-g'
  broken[1].positions[0].kind = 'co-op'
  broken[2].positions[0].times = 1
  broken.push({ personSlug: 'noah-tran', positions: [] })
  const errors = validateCareers(broken, content.people).join('\n')
  assert.match(errors, /"ronaldo-g" › personSlug: is not in people\.js/)
  assert.match(errors, /"michael-sicner" › positions\[0\]\.kind: "co-op" must be/)
  assert.match(errors, /"dereck-rubio" › positions\[0\]\.times: must be a whole number/)
  assert.match(errors, /"noah-tran" › personSlug: is used twice/)
  assert.match(errors, /"noah-tran" › positions: list at least one/)
})

test('in 2025–26 Emmanuel was a Project Manager and the Structures and Manufacturing Director', () => {
  const titles = rolesFor('emmanuel-jaimes')
    .filter((r) => r.season === '2025-26')
    .map((r) => r.title)
  assert.deepEqual(titles.sort(), ['Project Manager', 'Structures and Manufacturing Director'])
})
