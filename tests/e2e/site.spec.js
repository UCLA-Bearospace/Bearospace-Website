import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { allPaths, getMeta } from '../../src/site/meta.js'

// The prerendered site: every URL works without JavaScript, passes axe, and behaves
// well when navigated with JavaScript. `?scene=0` keeps the 3D scene out of the way.

const PATHS = allPaths()

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const path of PATHS) {
    test(`serves ${path}`, async ({ page }) => {
      const meta = getMeta(path)
      const res = await page.goto(path)
      expect(res.status()).toBe(200)
      await expect(page).toHaveTitle(meta.title)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', meta.description)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const text = await page.locator('main').innerText()
      expect(text.length).toBeGreaterThan(80)
      // Site navigation is reachable without the JS menu
      await expect(page.locator('#site-nav a')).toHaveCount(10)
    })
  }
})

test.describe('accessibility', () => {
  for (const path of PATHS) {
    test(`axe: ${path}`, async ({ page }) => {
      await page.goto(`${path}?scene=0`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const { violations } = await new AxeBuilder({ page }).analyze()
      const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious, serious.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join('\n')).toEqual([])
    })
  }

  test('axe: open menu dialog', async ({ page }) => {
    await page.goto('/about?scene=0')
    await page.getByRole('link', { name: 'Menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
  })
})

test('in-site navigation updates the title and moves focus to the new heading', async ({ page }) => {
  await page.goto('/?scene=0')
  await page.getByRole('navigation', { name: 'Destinations' }).getByRole('link', { name: /Engineering/ }).click()
  await expect(page).toHaveURL(/\/engineering$/)
  await expect(page).toHaveTitle(getMeta('/engineering').title)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()

  await page.getByRole('link', { name: 'Recovery' }).click()
  await expect(page).toHaveTitle(getMeta('/engineering/recovery').title)
  await expect(page.getByRole('heading', { level: 1, name: 'Recovery' })).toBeFocused()
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Engineering')
})

test('Back restores the scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/team?scene=0')
  await page.getByRole('link', { name: 'Alexander Astorga' }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(150)
  const y = await page.evaluate(() => window.scrollY)
  expect(y).toBeGreaterThan(200)
  await page.getByRole('link', { name: 'Alexander Astorga' }).click()
  await expect(page).toHaveURL(/alexander-astorga$/)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await page.goBack()
  await expect(page).toHaveURL(/\/team\?scene=0$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 5)
})

test('the menu opens as a dialog, closes with Escape, and returns focus', async ({ page }) => {
  await page.goto('/about?scene=0')
  const menu = page.getByRole('link', { name: 'Menu' })
  await menu.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Site menu' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(menu).toBeFocused()

  await menu.click()
  await dialog.getByRole('link', { name: 'Gallery' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/gallery$/)
})

test('unknown pages show the not-found page', async ({ page }) => {
  await page.goto('/?scene=0')
  await page.evaluate(() => {
    history.pushState({}, '', '/engineering/warp-drive')
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lost signal.')
  await expect(page).toHaveTitle(/Lost signal/)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
})

test('discipline pages carry the interest through to the join email', async ({ page }) => {
  await page.goto('/engineering/avionics?scene=0')
  await page.locator('.cta-band').getByRole('link', { name: 'Get involved' }).click()
  await expect(page).toHaveURL(/\/join\?interest=avionics$/)
  const href = await page.getByRole('link', { name: /Email us about joining/ }).getAttribute('href')
  expect(decodeURIComponent(href)).toContain('Joining Bearospace (Avionics)')
})

test('a direct link with ?interest hydrates without a mismatch', async ({ page }) => {
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto('/join?interest=recovery&scene=0')
  await expect(page.getByRole('link', { name: /Email us about joining Recovery/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('prerendered pages hydrate without errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  for (const path of ['/', '/about', '/engineering/payload-electronics', '/team/juan-ventura-romero', '/competitions', '/history']) {
    await page.goto(`${path}?scene=0`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForLoadState('networkidle')
  }
  expect(errors).toEqual([])
})

for (const path of ['/', '/about', '/team', '/competitions', '/gallery', '/join', '/team/juan-ventura-romero']) {
  test(`no horizontal scrolling at 320 px: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(`${path}?scene=0`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  })
}
