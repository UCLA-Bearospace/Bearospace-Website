import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allPaths, getMeta } from '../../src/site/meta.js'

test('every served path has its own title and description', () => {
  const paths = allPaths()
  const titles = new Set()
  for (const path of paths) {
    const meta = getMeta(path)
    assert.ok(!meta.notFound, `${path} resolves to a page`)
    assert.ok(meta.title && meta.description, `${path} has a title and description`)
    assert.ok(!titles.has(meta.title), `${path} title is unique`)
    titles.add(meta.title)
  }
  assert.ok(paths.includes('/engineering/payload-electronics'))
  assert.ok(paths.includes('/team/juan-ventura-romero'))
  assert.ok(paths.includes('/team/season/2025-26'))
})

test('people without consent and unpublished projects get no page', () => {
  const paths = allPaths()
  assert.ok(!paths.includes('/team/lucia-gonzalez'))
  assert.ok(!paths.includes('/projects/2025-26-launch-vehicle'))
  assert.ok(getMeta('/team/lucia-gonzalez').notFound)
})

test('unknown paths are not-found and noindex', () => {
  const meta = getMeta('/engineering/nope')
  assert.ok(meta.notFound && meta.noindex)
})

test('breadcrumbs lead back home', () => {
  assert.deepEqual(
    getMeta('/engineering/recovery').crumbs.map((c) => c.path),
    ['/', '/engineering', '/engineering/recovery'],
  )
})
