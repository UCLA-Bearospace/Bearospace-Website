import { test, expect } from '@playwright/test'

// Team pages and member profiles (slice 6). `?scene=0` keeps the 3D scene out of the way.

const h1 = (page) => page.getByRole('heading', { level: 1 })

test('a member profile shows the current role, disciplines, and structured data', async ({ page }) => {
  await page.goto('/team/juan-ventura-romero?scene=0')
  await expect(h1(page)).toHaveText('Juan Ventura-Romero')
  await expect(page.locator('main .kicker').first()).toHaveText('Payload Software Lead · 2026–27')
  await expect(page.locator('main').getByRole('link', { name: 'Payload Software' })).toHaveAttribute('href', '/engineering/payload-software')
  await expect(page.locator('.note--banner')).toHaveCount(0)
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent())
  expect(data).toMatchObject({ '@type': 'Person', name: 'Juan Ventura-Romero', jobTitle: 'Payload Software Lead' })
})

test('alumni keep their page, marked as alumni', async ({ page }) => {
  await page.goto('/team/isrrael-sumano?scene=0')
  await expect(page.locator('.note--banner')).toContainText('Alumni: on the team until 2025–26')
  await expect(page.locator('main .kicker').first()).toHaveText('Alumni · 2025–26')
})

test('Joel is listed under Vehicle and under Avionics & Recovery, as his role spans both', async ({ page }) => {
  await page.goto('/team?scene=0')
  for (const group of ['Vehicle', 'Avionics & Recovery']) {
    const section = page.locator('section', { has: page.getByRole('heading', { level: 2, name: group, exact: true }) })
    await expect(section.locator('.person-card', { hasText: 'Joel Venegas' })).toContainText('Structures & Recovery Director')
  }
})

test('people without consent have no page', async ({ page }) => {
  await page.goto('/team/lucia-gonzalez?scene=0')
  await expect(h1(page)).toHaveText('Lost signal.')
})

test('the 2025–26 roster carries the project manager\'s corrections, and no position is open', async ({ page }) => {
  await page.goto('/team/season/2025-26?scene=0')
  await expect(page.locator('.person-card', { hasText: 'Dario Kuroda' })).toBeVisible()
  await expect(page.locator('.person-card', { hasText: 'Kenneth Fambro' })).toContainText('Payload Lead')
  await expect(page.locator('.person-card', { hasText: 'Emmanuel Jaimes' })).toContainText('Structures and Manufacturing Director')
  await page.goto('/team?scene=0')
  await expect(page.locator('.person-card--open')).toHaveCount(0)
})

test('every portrait sits on the same panel, at 4:5', async ({ page }) => {
  await page.goto('/team?scene=0')
  const portraits = page.locator('.people-grid .portrait')
  const count = await portraits.count()
  expect(count).toBeGreaterThan(10)
  for (let i = 0; i < count; i++) {
    const p = portraits.nth(i)
    await expect(p).toHaveCSS('background-color', 'rgb(248, 248, 248)')
    const box = await p.boundingBox()
    expect(box.height / box.width).toBeCloseTo(1.25, 1)
  }
  // Photos come from the pipeline (flattened onto the panel), with no placeholder behind them
  for (const img of await page.locator('.people-grid .portrait img').all()) {
    expect(await img.getAttribute('src')).toMatch(/^\/media\/team\//)
  }
})

test('the season switcher moves between seasons', async ({ page }) => {
  await page.goto('/team?scene=0')
  const seasons = page.getByRole('navigation', { name: 'Seasons' })
  await expect(seasons.locator('[aria-current="page"]')).toHaveText('2026–27')
  await seasons.getByRole('link', { name: '2025–26' }).click()
  await expect(page).toHaveURL(/\/team\/season\/2025-26$/)
  await expect(h1(page)).toHaveText('The 2025–26 team')
  await expect(page.getByRole('navigation', { name: 'Seasons' }).getByRole('link', { name: '2026–27' })).toHaveAttribute('href', '/team')
})

test('arriving by navigation, cards rise in role order', async ({ page }) => {
  await page.goto('/about?scene=0')
  await page.locator('.site-header').getByRole('link', { name: 'Menu', exact: true }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Team', exact: true }).click()
  await expect(h1(page)).toHaveText('2026–27 leadership')
  const delays = await page
    .locator('.people-grid .person-card')
    .evaluateAll((cards) => cards.slice(0, 4).map((c) => parseFloat(getComputedStyle(c).animationDelay)))
  expect(delays).toEqual([0.16, 0.21, 0.26, 0.31])
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('cards appear without the reveal', async ({ page }) => {
    await page.goto('/about?scene=0')
    await page.locator('.site-header').getByRole('link', { name: 'Menu', exact: true }).click()
    await page.getByRole('dialog').getByRole('link', { name: 'Team', exact: true }).click()
    await expect(h1(page)).toHaveText('2026–27 leadership')
    await expect(page.locator('.people-grid .person-card').first()).toHaveCSS('animation-name', 'none')
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  test('the roster is at least two columns', async ({ page }) => {
    await page.goto('/team?scene=0')
    const cards = page.locator('.people-grid').first().locator('.person-card')
    const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()]
    expect(b.y).toBeCloseTo(a.y, 0)
    expect(b.x).toBeGreaterThan(a.x)
  })
})
