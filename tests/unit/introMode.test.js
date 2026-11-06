import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decideIntroMode } from '../../src/intro/introMode.js'

const base = {
  pathname: '/',
  search: '',
  reducedMotion: false,
  motionPaused: false,
  introPref: null,
  seen: false,
  sceneOff: false,
  saveData: false,
  effectiveType: '4g',
  webgl: true,
  restored: false,
}
const mode = (over) => decideIntroMode({ ...base, ...over })

test('first visit to the Flight Deck gets the full intro; returning visitors the short one', () => {
  assert.equal(mode({}), 'full')
  assert.equal(mode({ seen: true }), 'short')
  assert.equal(mode({ seen: true, search: '?intro=1' }), 'full')
})

test('no intro on deep links', () => {
  assert.equal(mode({ pathname: '/engineering' }), 'off')
  assert.equal(mode({ pathname: '/team/juan-ventura-romero' }), 'off')
})

test('no intro when motion is reduced or paused, or the visitor turned it off', () => {
  assert.equal(mode({ reducedMotion: true }), 'off')
  assert.equal(mode({ motionPaused: true }), 'off')
  assert.equal(mode({ introPref: 'off' }), 'off')
  assert.equal(mode({ search: '?intro=0' }), 'off')
  assert.equal(mode({ search: '?scene=0' }), 'off')
})

test('no intro on slow or data-saving connections, without WebGL, or on Back/Forward restores', () => {
  assert.equal(mode({ saveData: true }), 'off')
  assert.equal(mode({ effectiveType: '2g' }), 'off')
  assert.equal(mode({ effectiveType: 'slow-2g' }), 'off')
  assert.equal(mode({ effectiveType: '3g' }), 'full')
  assert.equal(mode({ webgl: false }), 'off')
  assert.equal(mode({ sceneOff: true }), 'off')
  assert.equal(mode({ restored: true }), 'off')
})
