import { mediaFor } from './media'

/**
 * Responsive image from the generated media manifest (`npm run images`).
 * `src` is the original's path under assets-src/images/, e.g. "gallery/preflight-briefing.jpg".
 */
export default function Img({ src, alt, sizes = '100vw', className, eager = false, ...rest }) {
  const m = mediaFor(src)
  if (!m) return null
  if (m.svg) {
    return (
      <img className={className} src={m.svg} alt={alt} width={m.width} height={m.height} decoding="async" {...rest} />
    )
  }
  const srcSet = (list) => list.map((s) => `${s.url} ${s.w}w`).join(', ')
  const fallback = m.webp[m.webp.length - 1]
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcSet(m.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(m.webp)} sizes={sizes} />
      <img
        src={fallback.url}
        alt={alt}
        width={m.width}
        height={m.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ backgroundColor: m.color, backgroundImage: `url("${m.lqip}")`, backgroundSize: 'cover' }}
        {...rest}
      />
    </picture>
  )
}
