import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('home page renders with a title and heading', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Bearospace/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('home page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/')
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious, serious.map((v) => v.id).join(', ')).toEqual([])
})
