import { defineConfig, devices } from '@playwright/test'

// Runs against a production build with test hooks (`npm run build:test` → dist-test/),
// served by `vite preview`. Firefox and WebKit join in slice 10 (docs/PLAN.md §11).
//
// @visual screenshot comparisons use per-platform baselines committed from a developer
// machine, and @perf needs a real GPU, so CI skips both. Locally: `npm run test:visual`
// and `npm run test:perf`.
export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      grepInvert: process.env.CI ? /@visual|@perf/ : /@perf/,
      use: {
        ...devices['Desktop Chrome'],
        // Software WebGL on GPU-less CI machines
        launchOptions: { args: ['--enable-unsafe-swiftshader'] },
      },
    },
    {
      // Frame-time probes need the real GPU; tests skip themselves on software renderers
      name: 'chromium-gpu',
      grep: /@perf/,
      grepInvert: process.env.CI ? /@perf/ : undefined,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-gpu', '--ignore-gpu-blocklist', ...(process.platform === 'win32' ? ['--use-angle=d3d11'] : [])],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run build:test && npx vite preview --outDir dist-test --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
