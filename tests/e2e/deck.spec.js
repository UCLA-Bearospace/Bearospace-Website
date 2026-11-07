import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// The Flight Deck menu and route transitions (slice 3). These run with the real 3D scene
// (software WebGL on CI), so waits are generous.

const READY = { timeout: 30_000 }
const h1 = (page) => page.getByRole('heading', { level: 1 })
const nav = (page) => page.getByRole('navigation', { name: 'Destinations' })
const dest = (page, name) => nav(page).getByRole('link', { name: new RegExp(`^${name}`) })
const idle = (page) => expect(page.locator('html')).not.toHaveAttribute('data-transition', /.*/, { timeout: 15_000 })

async function openDeck(page, size = { width: 1440, height: 900 }) {
  await page.setViewportSize(size)
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', READY)
  await expect(nav(page)).toHaveAttribute('data-layout', 'orbit')
  // Labels are visible once the engine has positioned them
  await expect(dest(page, 'Sponsors')).toBeVisible()
}

/** Navigate like the router does (no page reload), several times in a row. */
async function pushPaths(page, paths, gapMs) {
  await page.evaluate(
    async ({ paths, gapMs }) => {
      for (const p of paths) {
        history.pushState({ key: Math.random().toString(36).slice(2), idx: history.length }, '', p)
        dispatchEvent(new PopStateEvent('popstate'))
        await new Promise((r) => setTimeout(r, gapMs))
      }
    },
    { paths, gapMs },
  )
}

for (const size of [
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
]) {
  test(`orbit targets are large, on screen, and separate at ${size.width}x${size.height}`, async ({ page }) => {
    await openDeck(page, size)
    const boxes = []
    for (const link of await nav(page).getByRole('link').all()) {
      const b = await link.boundingBox()
      expect(b.width).toBeGreaterThanOrEqual(44)
      expect(b.height).toBeGreaterThanOrEqual(44)
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.x + b.width).toBeLessThanOrEqual(size.width)
      expect(b.y + b.height).toBeLessThanOrEqual(size.height)
      boxes.push(b)
    }
    expect(boxes).toHaveLength(8)
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const [a, b] = [boxes[i], boxes[j]]
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
        expect(overlap, `targets ${i} and ${j} overlap`).toBe(false)
      }
  })
}

test('keyboard: one tab stop, arrows move in order, Enter travels', async ({ page }) => {
  await openDeck(page)
  await expect(nav(page).locator('a[tabindex="0"]')).toHaveCount(1)
  await dest(page, 'About').focus()
  await page.keyboard.press('ArrowDown')
  await expect(dest(page, 'Engineering')).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(dest(page, 'Projects')).toBeFocused()
  await page.keyboard.press('End')
  await expect(dest(page, 'Sponsors')).toBeFocused()
  await page.keyboard.press('Home')
  await expect(dest(page, 'About')).toBeFocused()
  await expect(nav(page).locator('a[tabindex="0"]')).toHaveCount(1)

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/about$/)
  await expect(h1(page)).toHaveText('Built by students. Flown for real.')
  await idle(page)
  await expect(h1(page)).toBeFocused()
  expect(await page.evaluate(() => window.__bearo.stats().target)).toBe('about')
})

test('returning to the deck focuses the destination you came from', async ({ page }) => {
  await openDeck(page)
  await dest(page, 'Team').click()
  await expect(h1(page)).toHaveText('2026–27 leadership')
  await idle(page)
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/$/)
  await expect(h1(page)).toHaveText('Bearospace')
  await idle(page)
  await expect(dest(page, 'Team')).toBeFocused()
  expect(await page.evaluate(() => window.__bearo.stats().target)).toBe('rest')
})

test('Esc climbs one level at a time from a deep link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/team/joel-venegas')
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', READY)
  expect(await page.evaluate(() => window.__bearo.stats().target)).toBe('team')
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/team$/)
  await expect(h1(page)).toHaveText('2026–27 leadership')
  await idle(page)
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/\/$/)
  await expect(h1(page)).toHaveText('Bearospace')
  await idle(page)
  await expect(dest(page, 'Team')).toBeFocused()
})

test('rapid navigation lands on the newest page, with a matching label', async ({ page }) => {
  await openDeck(page)
  await pushPaths(page, ['/about', '/team', '/gallery'], 120)
  await expect(page).toHaveURL(/\/gallery$/)
  await expect(h1(page)).toHaveText('Launch days and lab nights')
  await idle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.locator('.wipe-label')).toHaveText('Gallery')
  expect(await page.evaluate(() => window.__bearo.stats().target)).toBe('gallery')
})

test('Back and Forward replay the transitions', async ({ page }) => {
  await openDeck(page)
  await dest(page, 'Team').click()
  await expect(h1(page)).toHaveText('2026–27 leadership')
  await idle(page)
  await page.getByRole('link', { name: 'Joel Venegas' }).click()
  await expect(h1(page)).toHaveText('Joel Venegas')
  await idle(page)
  await page.goBack()
  await expect(h1(page)).toHaveText('2026–27 leadership')
  await idle(page)
  await page.goBack()
  await expect(h1(page)).toHaveText('Bearospace')
  await idle(page)
  await page.goForward()
  await expect(h1(page)).toHaveText('2026–27 leadership')
  await idle(page)
  expect(await page.evaluate(() => window.__bearo.stats().target)).toBe('team')
})

test('a hidden tab mid-transition still lands on the page', async ({ page }) => {
  await openDeck(page)
  await dest(page, 'Engineering').click()
  await expect(page.locator('html')).toHaveAttribute('data-transition', 'travel')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(h1(page)).toHaveText('One rocket, seven disciplines', { timeout: 3000 })
  await idle(page)
})

test('resizing mid-travel still frames the page, and the deck re-fits', async ({ page }) => {
  await openDeck(page)
  await dest(page, 'About').click()
  await expect(page.locator('html')).toHaveAttribute('data-transition', 'travel')
  await page.setViewportSize({ width: 1024, height: 768 })
  await expect(h1(page)).toHaveText('Built by students. Flown for real.')
  await idle(page)
  expect(await page.evaluate(() => window.__bearo.stats().target)).toBe('about')
  await page.keyboard.press('Escape')
  await expect(h1(page)).toHaveText('Bearospace')
  await idle(page)
  for (const link of await nav(page).getByRole('link').all()) {
    const b = await link.boundingBox()
    expect(b.x + b.width).toBeLessThanOrEqual(1024)
    expect(b.y + b.height).toBeLessThanOrEqual(768)
  }
})

test('pausing motion switches to the list and plain fades', async ({ page }) => {
  await openDeck(page)
  await page.getByRole('button', { name: 'Pause motion' }).click()
  await expect(nav(page)).toHaveAttribute('data-layout', 'list')
  await dest(page, 'History').click()
  await expect(page.locator('html')).toHaveAttribute('data-transition', 'fade')
  await expect(h1(page)).toHaveText('Season by season')
  await idle(page)
  // The camera still framed the page, by cutting rather than flying
  expect(await page.evaluate(() => window.__bearo.stats().target)).toBe('history')
})

test('reduced motion gets the list layout', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', READY)
  await expect(nav(page)).toHaveAttribute('data-layout', 'list')
})

test('axe: the deck in orbit layout', async ({ page }) => {
  await openDeck(page)
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious, serious.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join('\n')).toEqual([])
})

// Phones: the deck is a list over the flying rocket, and the scene is paused (not torn
// down) behind content pages. Tearing it down on every navigation left iPhones on a blank
// screen after the wipe, and rebuilt the scene on every return to the deck.
test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('every destination opens, one after another, and the scene is kept', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready', READY)
    await expect(nav(page)).toHaveAttribute('data-layout', 'list')
    // The test hooks object is created once per engine: the same object means the same scene
    await page.evaluate(() => (window.__firstScene = window.__bearo))

    await dest(page, 'Engineering').tap()
    await expect(h1(page)).toHaveText('One rocket, seven disciplines')
    await idle(page)
    await expect(page.locator('.page')).toBeVisible()
    await expect(page.locator('.page')).toHaveCSS('opacity', '1')
    // Hidden behind the page: still there, not drawing
    expect(await page.evaluate(() => window.__bearo.stats().running)).toBe(false)
    expect(await page.evaluate(() => window.__bearo === window.__firstScene)).toBe(true)

    // A second page from the menu, then back to the deck and on to a third
    await page.locator('.site-header').getByRole('link', { name: 'Menu', exact: true }).tap()
    await page.getByRole('dialog').getByRole('link', { name: 'Team', exact: true }).tap()
    await expect(h1(page)).toHaveText('2026–27 leadership')
    await idle(page)
    await expect(page.locator('.page')).toHaveCSS('opacity', '1')

    await page.locator('.site-header').getByRole('link', { name: 'Bearospace home' }).tap()
    await expect(h1(page)).toHaveText('Bearospace')
    await idle(page)
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'ready')
    expect(await page.evaluate(() => window.__bearo.stats().running)).toBe(true)
    expect(await page.evaluate(() => window.__bearo === window.__firstScene)).toBe(true)

    await dest(page, 'Gallery').tap()
    await expect(h1(page)).toHaveText('Launch days and lab nights')
    await idle(page)
    await expect(page.locator('.page')).toHaveCSS('opacity', '1')
  })
})

test('a transition that breaks part-way still lands on the page, uncovered', async ({ page }) => {
  await openDeck(page)
  // The wipe's bands refuse to animate (a browser quirk, say)
  await page.evaluate(() => {
    const animate = Element.prototype.animate
    Element.prototype.animate = function (...args) {
      if (this.classList.contains('wipe-band')) throw new Error('no animation for you')
      return animate.apply(this, args)
    }
  })
  await dest(page, 'Team').click()
  await expect(h1(page)).toHaveText('2026–27 leadership')
  await idle(page)
  await expect(page.locator('.wipe')).toBeHidden()
  await expect(page.locator('main')).toHaveCSS('opacity', '1')
})
