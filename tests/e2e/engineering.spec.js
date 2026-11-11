import { test, expect } from '@playwright/test'
import { disciplines, zones, zonesFor } from '../../src/content/index.js'

// Engineering and the seven discipline pages (slice 5). `?scene=0` keeps the 3D scene out
// of the content checks; the highlight tests use the real scene (software WebGL on CI).

const h2s = (page) => page.locator('main h2')
const legend = (page) => page.locator('.system-map__legend li')
const READY = { timeout: 30_000 }

for (const d of disciplines) {
  test(`${d.name}: every section of the template, from content`, async ({ page }) => {
    await page.goto(`/engineering/${d.slug}?scene=0`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(d.name)
    const headings = await h2s(page).allTextContents()
    const expected = [
      "What we're responsible for",
      'Where it lives on the rocket',
      d.work.length && "What you'll work on",
      d.tools.length && 'Tools and methods',
      "Skills you'll build",
      'Who leads it in 2026–27',
    ].filter(Boolean)
    for (const h of expected) expect(headings).toContain(h)
    for (const item of [...d.responsibilities, ...d.skills]) await expect(page.locator('main').getByText(item, { exact: true }).first()).toBeVisible()

    // The map names only this discipline's sections, and says when a position is approximate
    const names = await legend(page).locator('.system-map__name').allTextContents()
    expect(names).toEqual(zonesFor(d.slug).map((z) => z.label))
    for (const z of zonesFor(d.slug)) {
      const item = legend(page).filter({ hasText: z.label })
      if (z.approximate) await expect(item).toContainText('approximate position')
      else await expect(item).not.toContainText('approximate')
    }

    // Every "Get involved" on the page (the main call to action, any open position) carries the interest
    const joins = page.getByRole('link', { name: 'Get involved', exact: true })
    await expect(page.locator('.cta-band').getByRole('link', { name: 'Get involved' })).toBeVisible()
    for (const link of await joins.all()) await expect(link).toHaveAttribute('href', `/join?interest=${d.slug}`)
  })
}

test('Payload Electronics is a Payload subteam, led by Nicholas Equihua, and works with Payload Software', async ({ page }) => {
  await page.goto('/engineering/payload-electronics?scene=0')
  await expect(page.locator('main .kicker').first()).toHaveText('Payload division')
  await expect(page.locator('main')).not.toContainText('shared between')
  await expect(page.getByRole('link', { name: 'Nicholas Equihua' })).toBeVisible()
  const software = page.locator('main li', { hasText: 'Payload Software, led by' })
  await expect(software.getByRole('link', { name: 'Juan Ventura-Romero' })).toHaveAttribute('href', '/team/juan-ventura-romero')
  await expect(software).toContainText('Payload Software Lead')
})

test('seven subteams: Avionics & Recovery together, Payload Software on its own', async ({ page }) => {
  await page.goto('/engineering?scene=0')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('One rocket, seven subteams')
  await expect(page.locator('.cards .card')).toHaveCount(7)
  await expect(page.getByRole('heading', { level: 2, name: 'Avionics & Recovery' })).toBeVisible()
  await expect(page.locator('main')).not.toContainText('Software across the vehicle')
  await page.goto('/engineering/payload-software?scene=0')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Payload Software')
  await expect(page.getByRole('link', { name: 'Juan Ventura-Romero' }).first()).toHaveAttribute('href', '/team/juan-ventura-romero')
  // No map caption: the heading above it says what it shows
  await expect(page.locator('.system-map figcaption')).toHaveCount(0)
})

test('the overview maps every section, and labels nothing inside the rocket', async ({ page }) => {
  await page.goto('/engineering?scene=0')
  const names = await legend(page).locator('.system-map__name').allTextContents()
  expect(names).toEqual(zones.map((z) => z.label))
  // Every discipline is reachable from the map
  for (const d of disciplines) await expect(legend(page).getByRole('link', { name: d.name, exact: true }).first()).toBeVisible()
  // The picture is part of the page: drawn without layout shift
  await expect(page.locator('.system-map__drawing')).toBeVisible()
  const shift = await page.evaluate(() => performance.getEntriesByType('layout-shift').reduce((sum, e) => sum + e.value, 0))
  expect(shift).toBeLessThan(0.01)
})

test('the map works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/engineering')
  await expect(legend(page)).toHaveCount(zones.length)
  await expect(legend(page).getByRole('link', { name: 'Avionics & Recovery' }).first()).toHaveAttribute('href', '/engineering/avionics-recovery')
  await expect(page.locator('.system-map__drawing')).toBeVisible()
  await context.close()
})

test.describe('with the 3D scene', () => {
  test.use({ viewport: { width: 1440, height: 900 } })
  const lit = (page) => page.evaluate(() => window.__bearo.stats().zones)

  test('hovering a discipline lights its section on the map and on the rocket', async ({ page }) => {
    await page.goto('/engineering')
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', READY)
    // Engineering frames the rocket itself
    expect(await page.evaluate(() => window.__bearo.stats().target)).toBe('engineering')

    const card = page.locator('.card', { has: page.getByRole('link', { name: 'Avionics & Recovery', exact: true }) })
    await card.hover()
    await expect(page.locator('.system-map .zone--recovery.is-on')).toHaveCount(2)
    await expect(legend(page).filter({ hasText: 'Recovery sections' })).toHaveClass(/is-on/)
    await expect(legend(page).filter({ hasText: 'Avionics bay' })).toHaveClass(/is-on/)
    await expect.poll(() => lit(page)).toEqual(zonesFor('avionics-recovery').flatMap((z) => z.segments))

    await page.mouse.move(5, 5)
    await expect(page.locator('.system-map .is-on')).toHaveCount(0)
    await expect.poll(() => lit(page)).toBeNull()
  })

  test('a discipline page lights its own section, and leaving clears it', async ({ page }) => {
    await page.goto('/engineering/aerodynamics')
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', READY)
    await expect.poll(() => lit(page)).toEqual(zonesFor('aerodynamics').flatMap((z) => z.segments))
    await page.getByRole('link', { name: 'Engineering', exact: true }).first().click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('One rocket, seven subteams')
    await expect.poll(() => lit(page)).toBeNull()
  })
})

for (const width of [375, 768, 1440]) {
  test(`@visual the Engineering overview at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/engineering?scene=0')
    await expect(page.locator('.system-map__drawing')).toBeVisible()
    await expect(page.locator('.system-map')).toHaveScreenshot(`system-map-${width}.png`)
  })
}
