import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DPR_STEPS, createGovernor, initialTier, pixelRatioFor } from '../../src/scene3d/quality.js'

const run = (gov, ms, durationMs) => {
  for (let t = 0; t < durationMs; t += ms) gov.sample(ms)
}

test('initial tier reflects the device', () => {
  assert.equal(initialTier({ cores: 2 }), 3)
  assert.equal(initialTier({ coarsePointer: true }), 2)
  assert.equal(initialTier({ width: 600 }), 2)
  assert.equal(initialTier({}), 1)
})

test('pixel ratio never exceeds the screen', () => {
  assert.equal(pixelRatioFor(0, 1), 1)
  assert.equal(pixelRatioFor(0, 3), DPR_STEPS[0])
})

test('steps down after sustained slow frames, ignoring the settle period', () => {
  const changes = []
  const gov = createGovernor(1, (t) => changes.push(t))
  run(gov, 30, 900) // inside the 1 s settle window: ignored
  assert.deepEqual(changes, [])
  run(gov, 30, 3000)
  assert.deepEqual(changes, [2])
})

test('steps up after long fast stretches, at most twice', () => {
  const changes = []
  const gov = createGovernor(4, (t) => changes.push(t))
  for (let i = 0; i < 5; i++) run(gov, 8, 12000)
  assert.deepEqual(changes, [3, 2])
})

test('stays put on steady 60 fps', () => {
  const changes = []
  const gov = createGovernor(1, (t) => changes.push(t))
  run(gov, 16.7, 20000)
  assert.deepEqual(changes, [])
})
