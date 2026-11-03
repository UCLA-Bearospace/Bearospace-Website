import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { verifyManifest } from '../../scripts/verify-assets.mjs'

test('every supplied original matches its recorded hash', () => {
  const { checked, problems } = verifyManifest()
  assert.ok(checked > 0)
  assert.deepEqual(problems, [])
})

test('the rocket STL is not served from public/', () => {
  assert.equal(existsSync('public/3d-models/rocket.STL'), false)
  assert.equal(existsSync('public/Logos/rocket.STL'), false)
})
