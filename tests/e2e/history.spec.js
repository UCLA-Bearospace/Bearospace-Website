import { test, expect } from '@playwright/test'
import { results } from '../../src/content/index.js'

// Projects, competitions, and history (slice 7). `?scene=0` keeps the 3D scene out of the way.

const unpublished = results.filter((r) => !r.publish)
const log = (page) => page.locator('table.log tbody tr')

test('the 2024–25 First Nations Launch awards read as report awards, never "third place overall"', async ({ page }) => {
  await page.goto('/competitions?scene=0')
  for (const category of ['Mars Challenge oral reports', 'Mars Challenge written reports']) {
    const row = log(page).filter({ hasText: category })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('2024–25')
    await expect(row.locator('td[data-label="Result"]')).toContainText('3rd')
    await expect(row.locator('.tag')).toHaveText('Report award')
    await expect(row.getByRole('link', { name: /Source/ })).toHaveAttribute('href', /^https?:\/\//)
  }
  await expect(page.locator('main')).not.toContainText(/third place overall/i)
})

test('every result in the mission log links to its source; unconfirmed ones never appear', async ({ page }) => {
  await page.goto('/competitions?scene=0')
  const rows = await log(page).all()
  expect(rows.length).toBe(results.filter((r) => r.publish).length)
  for (const row of rows) await expect(row.getByRole('link', { name: /Source/ })).toHaveAttribute('href', /^https?:\/\//)
  for (const r of unpublished) await expect(log(page).filter({ hasText: r.category }).filter({ hasText: r.season.replace('-', '–') })).toHaveCount(0)
})

test('history shows the same results with sources, and nothing unconfirmed', async ({ page }) => {
  await page.goto('/history?scene=0')
  await expect(page.locator('main')).not.toContainText('Tribal Category')
  await expect(page.locator('main')).not.toContainText('Bruin Rocketeers')
  const season = page.locator('#season-2024-25')
  await season.locator('summary').click()
  const oral = season.locator('li', { hasText: 'Mars Challenge oral reports' })
  await expect(oral.locator('.tag')).toHaveText('Report award')
  await expect(oral.getByRole('link', { name: /Source/ })).toHaveAttribute('href', /^https?:\/\//)
  // The gap in the record is stated, and computed from the data
  await expect(page.locator('main')).toContainText('No public record has been found yet for 2019–20 through 2022–23.')
})

test('the timeline works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/history')
  const older = page.locator('#season-2018-19')
  await expect(older).not.toHaveAttribute('open', /.*/)
  await older.locator('summary').click()
  await expect(older).toHaveAttribute('open', '')
  await expect(older).toContainText('First place, AISES Launch')
  // The jump list is plain in-page links
  await expect(page.getByRole('navigation', { name: 'Seasons' }).getByRole('link', { name: '2018–19' })).toHaveAttribute('href', '#season-2018-19')
  await context.close()
})

test('a project page shows status, season, sourced results, contributors, and when it was checked', async ({ page }) => {
  await page.goto('/projects/2018-19-fnl-rocket?scene=0')
  await expect(page.locator('main .status')).toHaveText('Completed')
  await expect(page.locator('main .kicker').first()).toContainText('2018–19')
  const result = page.locator('main li', { hasText: '1st place, AISES Launch category' })
  await expect(result.getByRole('link', { name: 'Source' })).toHaveAttribute('href', /^https?:\/\//)
  await expect(page.locator('.contributors')).toContainText('Lucia Gonzalez')
  await expect(page.locator('.contributors')).toContainText('Team co-leader')
  await expect(page.locator('main')).toContainText('Last verified 2026-11-02.')
  // Empty sections are left out, not shown as "TBD"
  for (const title of ['Testing', 'Lessons learned']) await expect(page.getByRole('heading', { name: title })).toHaveCount(0)
})

test('projects are grouped by season, with drafts kept off the site', async ({ page }) => {
  await page.goto('/projects?scene=0')
  await expect(page.getByRole('heading', { level: 2, name: '2018–19' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'First Nations Launch rocket' })).toBeVisible()
  await expect(page.locator('main')).not.toContainText('2025–26 launch vehicle')
  await page.goto('/projects/2025-26-launch-vehicle?scene=0')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lost signal.')
})

test('the mission log types itself in the first time, by navigation only', async ({ page }) => {
  await page.goto('/about?scene=0')
  const toCompetitions = async () => {
    await page.locator('.site-header').getByRole('link', { name: 'Menu', exact: true }).click()
    await page.getByRole('dialog').getByRole('link', { name: 'Competitions', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mission log')
  }
  await toCompetitions()
  await expect(page.locator('table.log')).toHaveClass(/log--type/)
  // Capped at 0.6 s a row
  const duration = await log(page).first().evaluate((r) => parseFloat(getComputedStyle(r).animationDuration))
  expect(duration).toBeLessThanOrEqual(0.6)
  // Second visit in the same session: no typing
  await page.locator('.site-header').getByRole('link', { name: 'Menu', exact: true }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'History', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Season by season')
  await toCompetitions()
  await expect(page.locator('table.log')).not.toHaveClass(/log--type/)
})

test('landing on the mission log shows it at once', async ({ page }) => {
  await page.goto('/competitions?scene=0')
  await expect(page.locator('table.log')).not.toHaveClass(/log--type/)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  test('results become labelled cards, with no sideways scrolling', async ({ page }) => {
    await page.goto('/competitions?scene=0')
    await expect(page.locator('table.log thead')).toHaveCSS('position', 'absolute')
    await expect(log(page).first()).toHaveCSS('display', 'block')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
    // The award tag stays with its category, not in the label column
    const cell = log(page).filter({ hasText: 'Mars Challenge oral reports' }).locator('td[data-label="Category"]')
    const offset = await cell.evaluate((td) => td.querySelector('.tag').getBoundingClientRect().left - td.getBoundingClientRect().left)
    expect(offset).toBeGreaterThan(100) // right of the 6.5rem label column
  })
})
