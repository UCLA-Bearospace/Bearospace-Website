// Makes web-ready images from the originals in assets-src/images/ (`npm run images`;
// also runs before dev and build). Originals are never modified.
//
// Output: public/media/<folder>/<name>-<width>.{avif,webp}   (metadata stripped)
//         public/media/icons/*                               favicons from the logo
//         src/generated/media.json   { "<folder>/<file>": { width, height, w: [widths], color?, lqip? } }
//                                    or { svg: 1, width, height } for SVG logos
//         src/generated/media-cache.json   content hashes, for the build only
//
// media.json is bundled into the main script, so it stays compact: every URL follows from
// the key and a width (/media/<folder>/<name>-<w>.<avif|webp>; src/components/media.js
// rebuilds them). Unchanged originals are skipped (keyed by content hash), so repeat runs
// are fast.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'assets-src', 'images')
const OUT = join(ROOT, 'public', 'media')
const MANIFEST = join(ROOT, 'src', 'generated', 'media.json')
const CACHE = join(ROOT, 'src', 'generated', 'media-cache.json')
const VERSION = 6 // bump to force a full rebuild after changing settings below

// Per folder: widths to generate, optional crop aspect (height / width), which files,
// whether to paint a loading placeholder (not for logos: their transparent areas would show
// it), an optional `panel` colour to flatten transparency onto, and an optional `maxBytes`
// per file (quality steps down until each file fits; docs/PLAN.md §8.9: ≤180 KB at 1280 w).
//
// Portraits: some originals are transparent cut-outs, most have a white background. All are
// flattened onto the same light panel (the white of the white-background photos), so every
// card matches; cutting the backgrounds out instead would risk clipping white shirts.
export const PORTRAIT_PANEL = { r: 248, g: 248, b: 248 }
const RECIPES = {
  gallery: { widths: [480, 640, 960, 1280], maxBytes: 180 * 1024 },
  team: { widths: [320, 480, 640], aspect: 1.25, panel: PORTRAIT_PANEL }, // 4:5, cropped from the top
  logos: { widths: [128, 256, 512, 929], placeholder: false, only: ['bearospace-logo.png', 'ucla-samueli-block.png', 'ucla-samueli-block-rev.png', 'anduril-logo.svg'] },
}

const read = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {})
const previous = read(MANIFEST)
const previousHashes = read(CACHE)
const manifest = {}
const hashes = {}
let built = 0
let skipped = 0

for (const [folder, recipe] of Object.entries(RECIPES)) {
  const dir = join(SRC, folder)
  mkdirSync(join(OUT, folder), { recursive: true })
  for (const file of readdirSync(dir).sort()) {
    if (recipe.only && !recipe.only.includes(file)) continue
    const key = `${folder}/${file}`
    const input = readFileSync(join(dir, file))
    const hash = createHash('sha256').update(input).update(String(VERSION)).digest('hex').slice(0, 16)
    hashes[key] = hash
    const name = basename(file, extname(file))
    const urlsOf = (w) => ['avif', 'webp'].map((format) => `/media/${folder}/${name}-${w}.${format}`)

    // SVG logos ship as-is (they scale and can be recoloured with CSS)
    if (extname(file) === '.svg') {
      copyFileSync(join(dir, file), join(OUT, folder, file))
      const m = readFileSync(join(dir, file), 'utf8').match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/)
      manifest[key] = { svg: 1, width: m ? +m[1] : null, height: m ? +m[2] : null }
      continue
    }

    const prev = previous[key]
    if (previousHashes[key] === hash && prev?.w?.flatMap(urlsOf).every((url) => existsSync(join(ROOT, 'public', url)))) {
      manifest[key] = prev
      skipped++
      continue
    }

    const meta = await sharp(input).metadata()
    const srcW = meta.width
    const outH = (w) => (recipe.aspect ? Math.round(w * recipe.aspect) : Math.round((w * meta.height) / meta.width))
    const base = () => {
      const img = recipe.panel ? sharp(input).rotate().flatten({ background: recipe.panel }) : sharp(input).rotate()
      return recipe.aspect ? img.resize({ width: srcW, height: Math.round(srcW * recipe.aspect), fit: 'cover', position: 'top' }) : img
    }
    const widths = [...new Set(recipe.widths.filter((w) => w < srcW).concat(Math.min(srcW, Math.max(...recipe.widths))))].sort((a, b) => a - b)

    const entry = { width: srcW, height: outH(srcW), w: widths }
    for (const w of widths) {
      for (const [format, options] of [
        ['avif', { quality: 50, effort: 4 }],
        ['webp', { quality: 74 }],
      ]) {
        const url = `/media/${folder}/${name}-${w}.${format}`
        let out
        for (let quality = options.quality; ; quality -= 8) {
          out = await base().resize({ width: w }).toFormat(format, { ...options, quality }).toBuffer()
          if (!recipe.maxBytes || out.length <= recipe.maxBytes || quality <= 30) break
        }
        writeFileSync(join(ROOT, 'public', url), out)
      }
    }
    if (recipe.placeholder !== false) {
      const { dominant } = await base().toBuffer().then((b) => sharp(b).stats())
      entry.color = `rgb(${dominant.r} ${dominant.g} ${dominant.b})`
      const tiny = await base().resize({ width: 16 }).webp({ quality: 40 }).toBuffer()
      entry.lqip = `data:image/webp;base64,${tiny.toString('base64')}`
    }
    manifest[key] = entry
    built++
  }
}

// Favicons from the badge
const logo = join(SRC, 'logos', 'bearospace-logo.png')
mkdirSync(join(OUT, 'icons'), { recursive: true })
for (const [file, size] of [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
]) {
  const out = join(OUT, 'icons', file)
  if (!existsSync(out) || built) await sharp(logo).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out)
}

mkdirSync(join(ROOT, 'src', 'generated'), { recursive: true })
writeFileSync(MANIFEST, JSON.stringify(manifest) + '\n')
writeFileSync(CACHE, JSON.stringify(hashes, null, 2) + '\n')
console.log(`images: ${built} built, ${skipped} unchanged, ${Object.keys(manifest).length} in src/generated/media.json`)
