import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // The lazy three.js scene chunk is ~560 kB raw; scripts/check-budgets.mjs enforces
  // the real (gzipped) budgets from docs/PLAN.md §9.5.
  // The manifest tells the prerender which chunks each page needs (it deletes the file after).
  build: { chunkSizeWarningLimit: 650, manifest: true },
})
