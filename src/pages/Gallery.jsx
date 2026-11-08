import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import PageFrame from '../components/PageFrame'
import Img from '../components/Img'
import { Sources } from '../components/bits'
import { SOURCES, gallery, galleryCategories, photoSlug, seasonLabel } from '../content/index.js'

// The gallery (docs/PLAN.md §8.9): a masonry grid of photos, category filters where a
// category has at least two photos, and a lightbox. Each photo has an address,
// /gallery?photo=<file name>: opening one adds a history entry, so Back closes it; arrows
// and swipes move through the photos without adding more. Without JavaScript the grid and
// captions are all there and the photo links simply reload the page.

const CATEGORY = { launch: 'Launch', build: 'Build', 'team-life': 'Team life', lab: 'Lab' }
const LARGE = '(min-width: 84rem) 1280px, 100vw'
// The grid's real column widths (the page panel's padding taken off): phones show two
// columns and fetch small photos; the lightbox loads the large one
const THUMB = '(min-width: 70rem) 22rem, (min-width: 40rem) calc(50vw - 4rem), calc(50vw - 3rem)'

// false on the server and while hydrating, true after: ?photo= is read only once hydrated,
// so a deep link renders the same HTML as the prerendered page first
const noop = () => () => {}
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Details({ photo }) {
  return (
    <>
      {photo.caption && <span>{photo.caption} </span>}
      <span className="note">
        {CATEGORY[photo.category]}
        {photo.season && ` · ${seasonLabel(photo.season)}`}
        {photo.date && ` · ${photo.date}`}
        {photo.credit && ` · Photo: ${photo.credit}`}
      </span>
    </>
  )
}

export default function Gallery() {
  const hydrated = useHydrated()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState(null)
  const categories = galleryCategories()
  const shown = gallery.filter((g) => !category || g.category === category)

  const slug = hydrated ? params.get('photo') : null
  const index = slug ? shown.findIndex((g) => photoSlug(g) === slug) : -1
  // A deep link to a photo the filter hides still opens it, from the full set
  const list = index < 0 && slug && gallery.some((g) => photoSlug(g) === slug) ? gallery : shown
  const at = slug ? list.findIndex((g) => photoSlug(g) === slug) : -1
  const photo = at >= 0 ? list[at] : null

  const opener = useRef(null) // the thumbnail link that opened the lightbox (focus returns there)
  const pushed = useRef(false) // whether opening added a history entry this page can go back over

  function open(e, g) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return // new tab etc.
    e.preventDefault()
    opener.current = e.currentTarget
    pushed.current = true
    setParams({ photo: photoSlug(g) })
  }
  function close() {
    if (pushed.current) {
      pushed.current = false
      navigate(-1)
    } else setParams({}, { replace: true }) // arrived by deep link: drop the photo, stay here
  }
  // From the live URL, not this render's photo (React Router's own params are this render's
  // too): two quick key presses must move two photos
  const step = (by) => {
    const now = new URLSearchParams(window.location.search).get('photo')
    const from = Math.max(
      list.findIndex((g) => photoSlug(g) === now),
      0,
    )
    setParams({ photo: photoSlug(list[(from + by + list.length) % list.length]) }, { replace: true })
  }

  // Back (or close) took the photo away: put focus back on the thumbnail it came from
  useEffect(() => {
    if (!slug && opener.current) {
      opener.current.focus({ preventScroll: true })
      opener.current = null
    }
  }, [slug])

  return (
    <PageFrame
      kicker="Gallery"
      title="Launch days and lab nights"
      lede="Behind every launch are countless hours of design reviews, manufacturing sessions, testing, and problem-solving — and the friendships formed along the way."
      wide
    >
      {categories.length >= 2 && (
        <div className="filters" role="group" aria-label="Show photos">
          {[null, ...categories].map((c) => (
            <button key={c ?? 'all'} type="button" className="filter" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c ? CATEGORY[c] : 'All photos'}
            </button>
          ))}
        </div>
      )}

      <ul className="gallery">
        {shown.map((g, i) => (
          <li key={g.src} style={{ '--i': i }}>
            <figure>
              <a href={`/gallery?photo=${photoSlug(g)}`} className="gallery__open" onClick={(e) => open(e, g)}>
                <Img
                  src={g.src}
                  alt={g.alt}
                  sizes={THUMB}
                  // The first photo is usually the page's largest paint: fetch it straight away
                  eager={i === 0}
                  fetchPriority={i === 0 ? 'high' : undefined}
                />
              </a>
              <figcaption>
                <Details photo={g} />
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <Sources items={[SOURCES.sitePhotos]} />

      {photo && (
        <Lightbox
          key="lightbox"
          photo={photo}
          position={`${at + 1} of ${list.length}`}
          opener={opener}
          onClose={close}
          onStep={step}
        />
      )}
    </PageFrame>
  )
}

/**
 * A modal <dialog>: the browser keeps focus inside it and makes the rest of the page inert.
 * Esc, the close button, or a click on the backdrop close it; ←/→ or a swipe move through
 * the photos. Opening grows the photo from its thumbnail (skipped with reduced motion).
 */
function Lightbox({ photo, position, opener, onClose, onStep }) {
  const dialog = useRef(null)
  const image = useRef(null)
  const swipe = useRef(null)

  useEffect(() => {
    const d = dialog.current
    d.showModal()
    // Grow from the thumbnail: start the photo at the thumbnail's box and let it settle
    const img = image.current?.querySelector('img')
    const start = opener.current?.getBoundingClientRect()
    if (img && start && !reducedMotion()) {
      const end = img.getBoundingClientRect()
      const dx = start.left + start.width / 2 - (end.left + end.width / 2)
      const dy = start.top + start.height / 2 - (end.top + end.height / 2)
      img.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${start.width / end.width})` }, { transform: 'none' }], {
        duration: 320,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      })
    }
    return () => {
      if (d.open) d.close()
    }
    // Once per opening: moving to another photo swaps the content, not the dialog
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') onStep(1)
    else if (e.key === 'ArrowLeft') onStep(-1)
    else return
    e.preventDefault()
  }

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={`Photo ${position}`}
      onCancel={(e) => {
        e.preventDefault() // Esc: close through the URL like the button does
        onClose()
      }}
      onKeyDown={onKeyDown}
      onClick={(e) => e.target === dialog.current && onClose()} // the backdrop
    >
      <div className="lightbox__bar">
        <span className="lightbox__count">{position}</span>
        <button type="button" className="button button--ghost" onClick={onClose} autoFocus>
          Close
        </button>
      </div>
      <figure
        className="lightbox__figure"
        onDragStart={(e) => e.preventDefault()} // a mouse drag is a swipe, not an image drag
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerCancel={() => (swipe.current = null)}
        onPointerUp={(e) => {
          const dx = swipe.current === null ? 0 : e.clientX - swipe.current
          swipe.current = null
          if (Math.abs(dx) > 50) onStep(dx < 0 ? 1 : -1)
        }}
      >
        <div ref={image} className="lightbox__image">
          <Img key={photo.src} src={photo.src} alt={photo.alt} sizes={LARGE} eager draggable={false} />
        </div>
        <figcaption>
          <Details photo={photo} />
        </figcaption>
      </figure>
      <div className="lightbox__nav">
        <button type="button" className="button button--ghost" onClick={() => onStep(-1)}>
          ← Previous
        </button>
        <button type="button" className="button button--ghost" onClick={() => onStep(1)}>
          Next →
        </button>
      </div>
    </dialog>
  )
}
