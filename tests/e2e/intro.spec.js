import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// The opening sequence (slice 4). These tests start with empty storage, like a first
// visit; everything else in the suite starts with the intro turned off.
test.use({ storageState: { cookies: [], origins: [] } })

const html = (page) => page.locator('html')
const skip = (page) => page.getByRole('button', { name: 'Skip intro' })
const deckTitle = (page) => page.getByRole('heading', { level: 1, name: 'Bearospace' })
const seen = (page) => page.evaluate(() => localStorage.getItem('bearo:intro-seen'))

test('first visit: Skip is focused, and Enter lands on a usable menu within 600 ms', async ({ page }) => {
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-intro', 'full')
  await expect(skip(page)).toBeFocused()
  // The page waits underneath
  await expect(deckTitle(page)).toBeHidden()

  await page.keyboard.press('Enter')
  await expect(deckTitle(page)).toBeVisible()
  await expect(page.locator('.intro')).toBeHidden()
  // From handling the skip to the live menu. (Key press to screen is timed on a real GPU in
  // the @perf test below: software WebGL can hold the main thread while compiling shaders.)
  const took = await page.evaluate(
    () => performance.getEntriesByName('intro:end')[0].startTime - performance.getEntriesByName('intro:skip')[0].startTime,
  )
  expect(took).toBeLessThan(600)
  await expect(deckTitle(page)).toBeFocused()
  await expect(html(page)).toHaveAttribute('data-intro', 'off')
  expect(await seen(page)).toBe('1')
  // The menu works (once the scene is ready the list becomes the orbit layout: let it settle)
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 30_000 })
  await expect(page.getByRole('navigation', { name: 'Destinations' })).toHaveAttribute('data-layout', 'orbit')
  await page.getByRole('navigation', { name: 'Destinations' }).getByRole('link', { name: /^Team/ }).click()
  await expect(page).toHaveURL(/\/team$/)
  // Camera travel + wipe; slow on software WebGL under parallel load
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2026–27 leadership', { timeout: 15_000 })
})

test('a tap anywhere skips too', async ({ page }) => {
  await page.goto('/')
  await expect(skip(page)).toBeFocused()
  await page.mouse.click(300, 300)
  await expect(deckTitle(page)).toBeVisible()
  await expect(html(page)).toHaveAttribute('data-intro', 'off')
})

test('the full intro plays through C–F and hands over to the live menu', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-intro-phase', 'scene', { timeout: 20_000 })
  // Liftoff marks the intro as seen
  await expect.poll(() => seen(page), { timeout: 20_000 }).toBe('1')
  await expect(html(page)).toHaveAttribute('data-intro', 'off', { timeout: 20_000 })
  await expect(deckTitle(page)).toBeVisible()
  await expect(deckTitle(page)).toBeFocused()
  const stats = await page.evaluate(() => window.__bearo.stats())
  expect(stats.target).toBe('rest')
  // The menu is live: orbit labels are pinned to the bodies
  await expect(page.getByRole('navigation', { name: 'Destinations' })).toHaveAttribute('data-layout', 'orbit')
})

test('returning visitors get the short intro, then the menu', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bearo:intro-seen', '1'))
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-intro', 'short')
  await expect(html(page)).toHaveAttribute('data-intro', 'off', { timeout: 15_000 })
  await expect(deckTitle(page)).toBeVisible()
})

test('@perf Skip lands on the menu within 600 ms of the key press', async ({ page }) => {
  await page.goto('/')
  await expect(skip(page)).toBeFocused()
  const t0 = Date.now()
  await page.keyboard.press('Enter')
  await expect(deckTitle(page)).toBeVisible()
  expect(Date.now() - t0).toBeLessThan(600)
})

// Durations need a real GPU (software WebGL stalls the timeline while compiling shaders):
// runs with `npm run test:perf`. Targets: short 2.4 s (≤ 3 s), full ~10 s.
for (const [mode, budget] of [
  ['short', 3_000],
  ['full', 10_600],
]) {
  test(`@perf the ${mode} intro holds the page for its designed length`, async ({ page }) => {
    if (mode === 'short') await page.addInitScript(() => localStorage.setItem('bearo:intro-seen', '1'))
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(html(page)).toHaveAttribute('data-intro', mode)
    await expect(html(page)).toHaveAttribute('data-intro', 'off', { timeout: 20_000 })
    const { held, renderer } = await page.evaluate(() => {
      const [start] = performance.getEntriesByName('intro:start')
      const [end] = performance.getEntriesByName('intro:end')
      const gl = document.querySelector('canvas')?.getContext('webgl2')
      const ext = gl?.getExtension('WEBGL_debug_renderer_info')
      return { held: end.startTime - start.startTime, renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '' }
    })
    test.skip(/SwiftShader|llvmpipe|Software/i.test(renderer), `software renderer (${renderer})`)
    test.info().annotations.push({ type: 'perf', description: `${mode} intro held ${Math.round(held)} ms on ${renderer}` })
    expect(held).toBeLessThan(budget)
  })
}

for (const [name, setup, url] of [
  ['a deep link', null, '/engineering'],
  ['reduced motion', (page) => page.emulateMedia({ reducedMotion: 'reduce' }), '/'],
  ['?intro=0', null, '/?intro=0'],
  [
    'no WebGL',
    (page) =>
      page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return /webgl/.test(type) ? null : original.call(this, type, ...args)
        }
      }),
    '/',
  ],
  ['paused motion', (page) => page.addInitScript(() => localStorage.setItem('bearo:motion-paused', '1')), '/'],
]) {
  test(`no intro, and no "seen" flag, for ${name}`, async ({ page }) => {
    await setup?.(page)
    await page.goto(url)
    await expect(html(page)).toHaveAttribute('data-intro', 'off')
    await expect(page.locator('.intro')).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForTimeout(500)
    expect(await seen(page)).toBeNull()
  })
}

test('Replay launch plays the full intro again', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bearo:intro-seen', '1'))
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-intro', 'off', { timeout: 10_000 })
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 30_000 })
  await page.locator('.deck__sponsors').getByRole('button', { name: 'Replay launch' }).click()
  await expect(html(page)).toHaveAttribute('data-intro', 'full')
  await expect(html(page)).toHaveAttribute('data-intro-phase', /dom|hold|scene/)
  await expect(skip(page)).toBeFocused()
  await skip(page).click()
  await expect(deckTitle(page)).toBeVisible()
})

test('Replay from another page goes home and plays', async ({ page }) => {
  await page.goto('/about')
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 30_000 })
  await page.locator('footer').getByRole('button', { name: 'Replay launch' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(html(page)).toHaveAttribute('data-intro', 'full', { timeout: 10_000 })
  await skip(page).click()
  await expect(deckTitle(page)).toBeVisible()
})

test('a long hidden tab resumes at the settle', async ({ page }) => {
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-intro-phase', 'scene', { timeout: 20_000 })
  const setHidden = (hidden) =>
    page.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { value: h, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    }, hidden)
  await setHidden(true)
  await page.waitForTimeout(2300)
  await setHidden(false)
  // From the settle it takes ~1.2 s to land
  await expect(html(page)).toHaveAttribute('data-intro', 'off', { timeout: 4_000 })
})

test('axe: the intro overlay', async ({ page }) => {
  await page.goto('/')
  await expect(skip(page)).toBeFocused()
  const { violations } = await new AxeBuilder({ page }).include('.intro').analyze()
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious, serious.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join('\n')).toEqual([])
})

test('the intro leaves no intro state behind', async ({ page }) => {
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-intro-phase', 'scene', { timeout: 20_000 })
  await expect(html(page)).toHaveAttribute('data-intro', 'off', { timeout: 20_000 })
  expect(await page.evaluate(() => window.__bearo.state())).toEqual({
    follow: true,
    target: 'rest',
    altitude: 3400,
    dusk: 0,
    speed: 1,
    thrust: 1,
    vacuum: 1,
    lines: 0.2,
    groundLock: 0,
    shake: 0,
    flash: 0,
    appear: 1,
  })
})

test('@visual the intro ends on exactly the Flight Deck shot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-intro-phase', 'scene', { timeout: 20_000 })
  await expect(html(page)).toHaveAttribute('data-intro', 'off', { timeout: 20_000 })
  await expect(page.locator('.deck__destinations a[tabindex="0"]')).toHaveCount(1)
  await page.waitForTimeout(700) // the page's fade-in
  await page.evaluate(() => {
    window.__bearo.setTier(1)
    window.__bearo.freeze(2)
  })
  // Should match the scene tests' Flight Deck baseline (rocket-1440x900): checked by eye
  // when baselines are refreshed; the state test above guards it automatically
  await expect(page).toHaveScreenshot('deck-after-intro-1440x900.png', { maxDiffPixelRatio: 0.004 })
})
