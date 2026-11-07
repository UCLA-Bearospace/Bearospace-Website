import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { gallery, galleryCategories, photoSlug } from '../../src/content/index.js'

// The gallery and its lightbox (slice 8). `?scene=0` keeps the 3D scene out of the way.

const links = (page) => page.locator('.gallery .gallery__open')
const lightbox = (page) => page.locator('dialog.lightbox')
const slugs = gallery.map(photoSlug)

test('every photo has alt text and its size reserved, so nothing shifts as they load', async ({ page }) => {
  await page.goto('/gallery?scene=0')
  const imgs = page.locator('.gallery img')
  await expect(imgs).toHaveCount(gallery.length)
  for (const img of await imgs.all()) {
    expect((await img.getAttribute('alt')).length).toBeGreaterThanOrEqual(8)
    expect(Number(await img.getAttribute('width'))).toBeGreaterThan(0)
    expect(Number(await img.getAttribute('height'))).toBeGreaterThan(0)
  }
  // Scroll everything into view so the lazy photos load, then measure
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 50))
    }
  })
  const shift = await page.evaluate(() => performance.getEntriesByType('layout-shift').reduce((sum, e) => sum + e.value, 0))
  expect(shift).toBeLessThan(0.05)
})

test('filters appear for categories with two or more photos, and filter the grid', async ({ page }) => {
  await page.goto('/gallery?scene=0')
  const group = page.getByRole('group', { name: 'Show photos' })
  const names = await group.getByRole('button').allTextContents()
  expect(names).toEqual(['All photos', ...galleryCategories().map((c) => ({ launch: 'Launch', 'team-life': 'Team life', build: 'Build', lab: 'Lab' })[c])])
  await group.getByRole('button', { name: 'Launch' }).click()
  await expect(group.getByRole('button', { name: 'Launch' })).toHaveAttribute('aria-pressed', 'true')
  await expect(links(page)).toHaveCount(gallery.filter((g) => g.category === 'launch').length)
  await group.getByRole('button', { name: 'All photos' }).click()
  await expect(links(page)).toHaveCount(gallery.length)
})

test('the lightbox works from the keyboard', async ({ page }) => {
  await page.goto('/gallery?scene=0')
  const first = links(page).first()
  await first.focus()
  await page.keyboard.press('Enter')
  await expect(lightbox(page)).toHaveAttribute('open', '')
  await expect(page).toHaveURL(`/gallery?photo=${slugs[0]}`)
  await expect(lightbox(page).getByRole('button', { name: 'Close' })).toBeFocused()
  await expect(lightbox(page)).toHaveAttribute('aria-label', `Photo 1 of ${gallery.length}`)

  const depth = await page.evaluate(() => history.length)
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(`/gallery?photo=${slugs[1]}`)
  await expect(lightbox(page)).toHaveAttribute('aria-label', `Photo 2 of ${gallery.length}`)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft') // wraps to the last photo
  await expect(page).toHaveURL(`/gallery?photo=${slugs.at(-1)}`)
  expect(await page.evaluate(() => history.length)).toBe(depth) // moving doesn't add history

  await page.keyboard.press('Escape')
  await expect(lightbox(page)).toHaveCount(0)
  await expect(page).toHaveURL('/gallery?scene=0')
  await expect(first).toBeFocused()
})

test('Back closes the lightbox', async ({ page }) => {
  await page.goto('/gallery?scene=0')
  await links(page).nth(2).click()
  await expect(page).toHaveURL(`/gallery?photo=${slugs[2]}`)
  await page.goBack()
  await expect(lightbox(page)).toHaveCount(0)
  await expect(page).toHaveURL('/gallery?scene=0')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Launch days and lab nights')
})

test('a shared photo link opens that photo, and closing stays on the gallery', async ({ page }) => {
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(`/gallery?photo=${slugs[4]}`)
  await expect(lightbox(page)).toHaveAttribute('open', '')
  await expect(lightbox(page).locator('img')).toHaveAttribute('alt', gallery[4].alt)
  await lightbox(page).getByRole('button', { name: 'Close' }).click()
  await expect(lightbox(page)).toHaveCount(0)
  await expect(page).toHaveURL('/gallery')
  expect(errors.filter((e) => /hydrat|did not match/i.test(e))).toEqual([])
})

test('the backdrop closes it, and a swipe moves to the next photo', async ({ page }) => {
  await page.goto('/gallery?scene=0')
  await links(page).first().click()
  const figure = lightbox(page).locator('.lightbox__figure')
  const box = await figure.boundingBox()
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 3)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 3, { steps: 5 })
  await page.mouse.up()
  await expect(page).toHaveURL(`/gallery?photo=${slugs[1]}`)
  // A click outside the content lands on the dialog itself (the backdrop area)
  await page.mouse.click(5, 5)
  await expect(lightbox(page)).toHaveCount(0)
})

test('axe: the open lightbox', async ({ page }) => {
  await page.goto('/gallery?scene=0')
  await links(page).first().click()
  await expect(lightbox(page)).toHaveAttribute('open', '')
  const { violations } = await new AxeBuilder({ page }).include('dialog.lightbox').analyze()
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious, serious.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join('\n')).toEqual([])
})

test('opening grows the photo from its thumbnail', async ({ page }) => {
  await page.goto('/gallery?scene=0')
  await links(page).first().click()
  expect(await lightbox(page).locator('img').evaluate((img) => img.getAnimations().length)).toBe(1)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('the lightbox opens without the grow animation', async ({ page }) => {
    await page.goto('/gallery?scene=0')
    await links(page).first().click()
    await expect(lightbox(page)).toHaveAttribute('open', '')
    expect(await lightbox(page).locator('img').evaluate((img) => img.getAnimations().length)).toBe(0)
  })
})

test('without JavaScript every photo and caption is there, linked to its address', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/gallery')
  await expect(links(page)).toHaveCount(gallery.length)
  await expect(links(page).first()).toHaveAttribute('href', `/gallery?photo=${slugs[0]}`)
  await expect(page.locator('.gallery figcaption')).toHaveCount(gallery.length)
  await context.close()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  test('no sideways scrolling, and the open photo fits the screen', async ({ page }) => {
    await page.goto('/gallery?scene=0')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
    await links(page).first().tap()
    const img = await lightbox(page).locator('img').boundingBox()
    expect(img.y + img.height).toBeLessThanOrEqual(812)
    await expect(lightbox(page).getByRole('button', { name: 'Next →' })).toBeInViewport()
  })
})
