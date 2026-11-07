// Writes static HTML for every route so pages load fast, work without JavaScript, and
// are readable by search engines. Runs after the client and SSR builds (`npm run build`).
//
//   node scripts/prerender.mjs <outDir>     (dist or dist-test)
//
// Output: <outDir>/<path>.html for every path in allPaths() (index.html for /), 404.html,
// and sitemap.xml + robots.txt when org.siteUrl is set.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const outDir = join(ROOT, process.argv[2] ?? 'dist')
const ssrEntry = join(ROOT, 'dist-ssr', 'entry-server.js')
const { render, allPaths, getMeta, org, decideIntroMode, readIntroEnv, pageModules, pageKeyFor } = await import(
  pathToFileURL(ssrEntry).href
)

// Decides before first paint whether the opening sequence plays (src/intro/introMode.js,
// serialized), so the overlay is on screen from the first frame and deep links never see it
const introScript =
  `<script>try{document.documentElement.dataset.intro=(${decideIntroMode})((${readIntroEnv})())}` +
  `catch(e){document.documentElement.dataset.intro='off'}` +
  // While it plays, Skip has focus from the first frame, and a key press or tap before the
  // Flight Deck's chunk arrives still counts (src/intro/sequence.js picks it up)
  `if(document.documentElement.dataset.intro!=='off'){var w=window,f=function(e){` +
  `if(e.type!=='keydown'||!/^(Shift|Control|Alt|Meta)$/.test(e.key))w.__introSkip=1};` +
  `w.__introEarly=f;addEventListener('keydown',f,true);addEventListener('pointerdown',f,true);` +
  `document.addEventListener('DOMContentLoaded',function(){var b=document.querySelector('.intro__skip');` +
  `b&&b.focus({preventScroll:true})})}</script>`

// Inline the (small) stylesheet so first paint doesn't wait on a second request, and move
// the app script after the content so the browser treats the page text as the priority
let template = readFileSync(join(outDir, 'index.html'), 'utf8').replace(
  /<link rel="stylesheet" crossorigin href="\/assets\/([^"]+\.css)">/,
  (_, file) => `<style>${readFileSync(join(outDir, 'assets', file), 'utf8')}</style>`,
)
// Fetch the two Latin text fonts with the HTML instead of after the CSS is parsed, so text
// rarely paints in a fallback font first and reflows when they arrive (layout shift)
const fonts = readdirSync(join(outDir, 'assets')).filter((f) =>
  /^(saira|atkinson-hyperlegible-next)-latin-wght-normal-[\w-]+\.woff2$/.test(f),
)
if (fonts.length !== 2) throw new Error(`prerender: expected 2 fonts to preload, found ${fonts.join(', ') || 'none'}`)
template = template.replace(
  '</head>',
  `${fonts.map((f) => `  <link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`).join('\n  ')}\n  </head>`,
)
const scripts = template.match(/\s*<script type="module"[^>]*><\/script>|\s*<link rel="modulepreload"[^>]*>/g) ?? []
for (const s of scripts) template = template.replace(s, '')
const lowPriority = (tag) => tag.trim().replace(/^<(script|link)/, '<$1 fetchpriority="low"')
template = template.replace('</body>', `${scripts.map(lowPriority).join('\n    ')}\n  </body>`)
// Each page's own chunks (from Vite's manifest), listed in its HTML as low-priority
// modulepreloads: they download alongside the main bundle instead of waiting for it to run
const manifestFile = join(outDir, '.vite', 'manifest.json')
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
function pageChunks(path) {
  const files = new Set()
  const visit = (key) => {
    const entry = manifest[key]
    if (!entry || entry.isEntry || files.has(entry.file)) return
    files.add(entry.file)
    for (const k of entry.imports ?? []) visit(k)
  }
  const source = `src/pages/${pageModules[pageKeyFor(path)]}.jsx`
  if (!manifest[source]) throw new Error(`prerender: ${source} is not in the build manifest`)
  visit(source)
  return [...files].map((f) => `<link rel="modulepreload" fetchpriority="low" crossorigin href="/${f}" />`).join('\n    ')
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function page(path) {
  const meta = getMeta(path)
  const url = `${org.siteUrl ?? ''}${meta.path}`
  const head = [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}" />`,
    // Canonical URLs must be absolute; added once a domain is chosen (checklist C14)
    org.siteUrl ? `<link rel="canonical" href="${escape(url)}" />` : '',
    `<meta name="robots" content="${meta.noindex ? 'noindex' : 'index,follow'}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escape(org.name)}" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\u003c')}</script>` : '',
    path === '/'
      ? `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: org.name,
          description: org.mission,
          parentOrganization: { '@type': 'CollegeOrUniversity', name: 'University of California, Los Angeles' },
          ...(org.siteUrl ? { url: org.siteUrl } : {}),
        })}</script>`
      : '',
  ].join('\n    ')
  return template
    .replace('<head>', path === '/' ? `<head>\n    ${introScript}` : '<head>')
    .replace(/<title>.*?<\/title>\s*/s, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`)
    .replace('</body>', `  ${pageChunks(path)}\n  </body>`)
}

// Flat files (about.html, team/joel-venegas.html): Vercel's cleanUrls and `vite preview`
// both serve them at the clean URL (/about), without a trailing-slash redirect.
const paths = allPaths()
for (const path of paths) {
  const file = path === '/' ? join(outDir, 'index.html') : join(outDir, `${path}.html`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, page(path))
}
writeFileSync(join(outDir, '404.html'), page('/404'))

if (org.siteUrl) {
  const urls = paths.map((p) => `  <url><loc>${org.siteUrl}${p === '/' ? '' : p}</loc></url>`).join('\n')
  writeFileSync(
    join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  )
  writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${org.siteUrl}/sitemap.xml\n`)
} else {
  writeFileSync(join(outDir, 'robots.txt'), 'User-agent: *\nAllow: /\n')
  console.warn('prerender: org.siteUrl is not set, so no sitemap.xml was written (checklist C14)')
}

rmSync(join(ROOT, 'dist-ssr'), { recursive: true, force: true })
rmSync(join(outDir, '.vite'), { recursive: true, force: true }) // build manifest: not for serving
console.log(`prerender: ${paths.length} pages + 404.html → ${process.argv[2] ?? 'dist'}/`)
