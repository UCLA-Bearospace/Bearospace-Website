// Makes web-ready images from the originals in assets-src/images/ (`npm run images`;
// also runs before dev and build). Originals are never modified.
//
// Output: public/media/<folder>/<name>-<width>.{avif,webp}   (metadata stripped)
//         public/media/icons/*                               favicons from the logo
//         src/generated/media.json   { "<folder>/<file>": { width, height, color, lqip, avif, webp } }
//
// Unchanged originals are skipped (keyed by content hash), so repeat runs are fast.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'assets-src', 'images')
const OUT = join(ROOT, 'public', 'media')
const MANIFEST = join(ROOT, 'src', 'generated', 'media.json')
const VERSION = 2 // bump to force a full rebuild after changing settings below

// Per folder: widths to generate, optional crop aspect (height / width), and which files
const RECIPES = {
  gallery: { widths: [480, 960, 1280] },
  team: { widths: [320, 640], aspect: 1.25 }, // 4:5 portraits, cropped from the top
  logos: { widths: [128, 256, 512, 929], only: ['bearospace-logo.png', 'ucla-samueli-block.png', 'anduril-logo.svg'] },
}

const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
const manifest = {}
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
    const name = basename(file, extname(file))

    // SVG logos ship as-is (they scale and can be recoloured with CSS)
    if (extname(file) === '.svg') {
      copyFileSync(join(dir, file), join(OUT, folder, file))
      const m = readFileSync(join(dir, file), 'utf8').match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/)
      manifest[key] = { hash, svg: `/media/${key}`, width: m ? +m[1] : null, height: m ? +m[2] : null }
      continue
    }

    const prev = previous[key]
    if (prev?.hash === hash && [...prev.avif, ...prev.webp].every((s) => existsSync(join(ROOT, 'public', s.url)))) {
      manifest[key] = prev
      skipped++
      continue
    }

    const meta = await sharp(input).metadata()
    const srcW = meta.width
    const outH = (w) => (recipe.aspect ? Math.round(w * recipe.aspect) : Math.round((w * meta.height) / meta.width))
    const base = () => {
      const img = sharp(input).rotate()
      return recipe.aspect ? img.resize({ width: srcW, height: Math.round(srcW * recipe.aspect), fit: 'cover', position: 'top' }) : img
    }
    const widths = [...new Set(recipe.widths.filter((w) => w < srcW).concat(Math.min(srcW, Math.max(...recipe.widths))))].sort((a, b) => a - b)

    const entry = { hash, width: srcW, height: outH(srcW), avif: [], webp: [] }
    for (const w of widths) {
      for (const [format, options] of [
        ['avif', { quality: 50, effort: 4 }],
        ['webp', { quality: 74 }],
      ]) {
        const url = `/media/${folder}/${name}-${w}.${format}`
        await base().resize({ width: w }).toFormat(format, options).toFile(join(ROOT, 'public', url))
        entry[format].push({ w, url })
      }
    }
    const { dominant } = await sharp(input).stats()
    entry.color = `rgb(${dominant.r} ${dominant.g} ${dominant.b})`
    const tiny = await base().resize({ width: 16 }).webp({ quality: 40 }).toBuffer()
    entry.lqip = `data:image/webp;base64,${tiny.toString('base64')}`
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
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`images: ${built} built, ${skipped} unchanged, ${Object.keys(manifest).length} in src/generated/media.json`)
