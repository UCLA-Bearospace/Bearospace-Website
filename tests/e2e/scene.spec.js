import { test, expect } from '@playwright/test'

// The flying-rocket backdrop: real model, every fallback, and motion controls.
// Relies on the test build's window.__bearo hooks (see src/scene3d/FlightScene.jsx).

const html = (page) => page.locator('html')

function trackErrors(page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('renders the real rocket model', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 })
  await expect(html(page)).toHaveAttribute('data-model', 'real')
  await expect(page.locator('.scene-canvas')).toHaveCSS('opacity', '1')
  await expect(page.locator('.poster')).toHaveAttribute('data-hidden', 'true')
  expect(errors).toEqual([])
})

test('keeps the placeholder rocket when the model fails to load', async ({ page }) => {
  const errors = trackErrors(page)
  await page.route('**/models/rocket.jvm2', (route) => route.fulfill({ status: 404 }))
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 })
  await expect(html(page)).toHaveAttribute('data-model', 'placeholder')
  expect(errors).toEqual([])
})

test('shows the static poster without WebGL', async ({ page }) => {
  const errors = trackErrors(page)
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : original.call(this, type, ...args)
    }
  })
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-scene', 'off')
  await expect(page.locator('.poster-rocket')).toBeVisible()
  await expect(page.locator('.poster')).not.toHaveAttribute('data-hidden')
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(errors).toEqual([])
})

test('falls back on context loss, recovers once, and stays off after a repeat', async ({ page }) => {
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 })

  await page.evaluate(() => window.__bearo.loseContext())
  await expect(html(page)).toHaveAttribute('data-scene', 'lost')
  await expect(page.locator('.poster')).not.toHaveAttribute('data-hidden')

  await page.evaluate(() => window.__bearo.restoreContext())
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 })

  // A second loss within a minute: give up on 3D for the session
  await page.evaluate(() => window.__bearo.loseContext())
  await expect(html(page)).toHaveAttribute('data-scene', 'off')
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(await page.evaluate(() => sessionStorage.getItem('bearo:scene-off'))).toBe('1')
})

test('pause motion stops rendering and persists across reloads', async ({ page }) => {
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 })
  const toggle = page.getByRole('button', { name: 'Pause motion' })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(await page.evaluate(() => window.__bearo.stats().running)).toBe(true)

  await toggle.click()
  const play = page.getByRole('button', { name: 'Play motion' })
  await expect(play).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => window.__bearo.stats().running)).toBe(false)

  await page.reload()
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Play motion' })).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => window.__bearo.stats().running)).toBe(false)
})

test('reduced motion renders a still frame with no pause control', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 })
  expect(await page.evaluate(() => window.__bearo.stats().running)).toBe(false)
  await expect(page.getByRole('button', { name: /motion/ })).toHaveCount(0)
})

test('stops rendering while the tab is hidden', async ({ page }) => {
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 })
  const setHidden = (hidden) =>
    page.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { value: h, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    }, hidden)
  await setHidden(true)
  expect(await page.evaluate(() => window.__bearo.stats().running)).toBe(false)
  await setHidden(false)
  expect(await page.evaluate(() => window.__bearo.stats().running)).toBe(true)
})

for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [375, 812],
]) {
  test(`@visual rocket framing at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 20_000 })
    // Wait out the poster → canvas crossfade, and for the deck to hydrate (it decides
    // whether the bodies show), so the frame is stable
    await expect(page.locator('.scene-canvas')).toHaveCSS('opacity', '1')
    await expect(page.locator('.deck__destinations a[tabindex="0"]')).toHaveCount(1)
    // Pin the quality tier: under load the governor may have lowered resolution and stars
    await page.evaluate(() => {
      window.__bearo.setTier(1)
      window.__bearo.freeze(2)
    })
    // The rocket is thin: a small pixel share is a big visual change
    await expect(page).toHaveScreenshot(`rocket-${width}x${height}.png`, { maxDiffPixelRatio: 0.004 })
  })
}

test('@visual poster framing without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null
  })
  await page.goto('/')
  await expect(html(page)).toHaveAttribute('data-scene', 'off')
  await expect(page).toHaveScreenshot('poster-1280x720.png', { maxDiffPixelRatio: 0.001 })
})

// Budgets from docs/PLAN.md §9.5: p95 ≤ 16.7 ms desktop, ≤ 33 ms on a phone-class CPU.
// A small allowance covers rAF jitter around the 60 Hz vsync interval.
for (const { name, width, height, cpu, budget } of [
  { name: 'desktop', width: 1440, height: 900, cpu: 1, budget: 16.7 * 1.1 },
  { name: 'phone-class CPU (4× throttle)', width: 375, height: 812, cpu: 4, budget: 33 },
]) {
  test(`@perf frame time, ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    if (cpu > 1) {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
    }
    await page.goto('/')
    await expect(html(page)).toHaveAttribute('data-scene', 'ready', { timeout: 30_000 })
    const renderer = await page.evaluate(() => {
      const gl = document.querySelector('canvas').getContext('webgl2')
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown'
    })
    test.skip(/SwiftShader|llvmpipe|Software/i.test(renderer), `software renderer (${renderer}) is not representative`)
    await page.waitForTimeout(6000)
    const stats = await page.evaluate(() => window.__bearo.stats())
    test.info().annotations.push({ type: 'perf', description: `${renderer} ${JSON.stringify(stats)}` })
    expect(stats.frames).toBe(240)
    expect(stats.p95).toBeLessThanOrEqual(budget)
  })
}
