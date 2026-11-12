import { test, expect } from '@playwright/test'
import { links, sponsorList } from '../../src/content/index.js'

// Sponsors and Join (slice 9). `?scene=0` keeps the 3D scene out of the way where it isn't
// needed. Every check reads the sponsor records, so a new sponsor is covered automatically.

const main = (page) => page.locator('main')
const intro = sponsorList({ intro: true })
const withLogo = sponsorList().filter((s) => s.logo)

test('every sponsor appears on the Sponsors page in order, the lead sponsor largest', async ({ page }) => {
  await page.goto('/sponsors?scene=0')
  // Past partners have their own section below (see the next tests)
  const names = await page.locator('.sponsor-card:not(.sponsor-card--past-partner) .sponsor-card__name').allTextContents()
  expect(names).toEqual(sponsorList().map((s) => s.name))
  await expect(page.locator('.sponsor-card').first()).toContainText('Supported by Anduril')
  const [lead, next] = await page.locator('.sponsor-card img').evaluateAll((imgs) => imgs.slice(0, 2).map((i) => i.getBoundingClientRect().height))
  expect(lead).toBeGreaterThan(next)
})

test('sponsors with a logo appear in the "Supported by" strip on every page', async ({ page }) => {
  for (const path of ['/about', '/gallery']) {
    await page.goto(`${path}?scene=0`)
    const strip = page.locator('.sponsor-strip').first()
    for (const s of withLogo) await expect(strip.getByRole('link', { name: `${s.name} — ${s.label}` })).toBeVisible()
  }
})

test.describe('the opening sequence', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test('shows every intro sponsor, in order, with its kicker', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('.intro__sponsor')
    await expect(cards).toHaveCount(intro.length)
    for (const [i, s] of intro.entries()) await expect(cards.nth(i)).toContainText(s.introKicker)
  })
})

test('a sponsor reaches the sponsorship email in at most two clicks from the Flight Deck', async ({ page }) => {
  const sponsorship = `mailto:${links.email}?subject=${encodeURIComponent('Sponsorship inquiry — Bearospace')}`
  await page.goto('/?scene=0')
  // "Sponsor a launch" opens the Sponsors page (a mailto: link did nothing without a mail app),
  // then its email button; the address is also written out for copying
  await page.getByRole('link', { name: 'Sponsor a launch' }).first().click()
  await expect(page).toHaveURL(/\/sponsors$/)
  await expect(page.getByRole('link', { name: 'Email us about sponsorship' })).toHaveAttribute('href', sponsorship)
  await expect(main(page)).toContainText(links.email)
})

test('past partners are listed by name, with no logo, and stay out of the intro and the strip', async ({ page }) => {
  await page.goto('/sponsors?scene=0')
  const section = page.locator('section', { has: page.getByRole('heading', { name: 'Past meeting partners and collaborators' }) })
  const mach = section.locator('li', { hasText: 'Mach Industries' })
  await expect(mach).toBeVisible()
  await expect(mach.locator('img')).toHaveCount(0)
  await expect(mach.getByRole('link')).toHaveCount(0)
  await expect(page.locator('.site-footer')).not.toContainText('Mach Industries')
  await page.goto('/?scene=0')
  await expect(page.locator('.deck__sponsors')).not.toContainText('Mach Industries')
})

test('the Sponsors page invents no sponsorship tiers, prices, or donation links', async ({ page }) => {
  await page.goto('/sponsors?scene=0')
  await expect(main(page)).not.toContainText(/\btiers?\b|donat|\$\d|platinum|gold level|silver level/i)
})

test('joining starts with the Discord, and drop-in times live in its announcements', async ({ page }) => {
  await page.goto('/join?scene=0')
  const discord = page.getByRole('link', { name: 'Join the Bearospace Discord' })
  await expect(discord).toHaveAttribute('href', 'https://discord.gg/SUWtpwJ8AB')
  await expect(discord).toHaveClass(/button--gold/)
  await expect(main(page)).toContainText('drop by Boelter Hall during one of our meetings or office hours')
  await expect(main(page)).toContainText('announcements channel')
  await expect(page.getByRole('link', { name: 'Email us about joining' })).toHaveAttribute('href', /^mailto:/)
  // No membership rule is stated, because none has been confirmed
  await expect(main(page)).not.toContainText(/AISES member|member of AISES|join AISES/i)
})

test('a discipline interest carries into the Discord prompt and the email', async ({ page }) => {
  await page.goto('/join?interest=avionics-recovery&scene=0')
  await expect(main(page)).toContainText('and ask about Avionics & Recovery')
  await expect(page.getByRole('link', { name: 'Email us about joining Avionics & Recovery' })).toHaveAttribute(
    'href',
    /Joining%20Bearospace%20\(Avionics%20%26%20Recovery\)/,
  )
})

test('Discord is in the footer, and the contact buttons are easy to tap', async ({ page }) => {
  await page.goto('/join?scene=0')
  await expect(page.locator('.site-footer').getByRole('link', { name: 'Discord' })).toHaveAttribute('href', links.discord)
  for (const button of await page.locator('.contact-buttons .button').all()) {
    expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44)
  }
})
