import { useRef } from 'react'
import { Link, useLocation } from 'react-router'
import Img from '../components/Img'
import { destinations } from '../site/destinations.js'
import { getMeta } from '../site/meta.js'
import { setMotionPaused, useMotionPaused, useReducedMotion } from '../motion/useMotionPref'
import { announce } from './announcer'

/** Compact navigation shown on every page: home badge, breadcrumb, menu, pause. */
export default function Header() {
  const { pathname } = useLocation()
  const crumbs = getMeta(pathname).crumbs
  const dialog = useRef(null)
  const paused = useMotionPaused()
  const reduced = useReducedMotion()

  // Without JavaScript the Menu link jumps to the footer's site navigation
  function openMenu(e) {
    if (!dialog.current?.showModal) return
    e.preventDefault()
    dialog.current.showModal()
  }
  const close = () => dialog.current?.close()

  function toggleMotion() {
    setMotionPaused(!paused)
    announce(paused ? 'Motion playing' : 'Motion paused')
  }

  return (
    <header className="site-header">
      <Link to="/" className="site-header__badge" aria-label="Bearospace home">
        <Img src="logos/bearospace-logo.png" alt="" sizes="48px" eager />
      </Link>

      {crumbs.length > 1 && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            {crumbs.map((c, i) => (
              <li key={c.path}>
                {i < crumbs.length - 1 ? <Link to={c.path}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="site-header__actions">
        {!reduced && (
          <button type="button" className="button button--ghost" aria-pressed={paused} onClick={toggleMotion}>
            {paused ? 'Play motion' : 'Pause motion'}
          </button>
        )}
        <a href="#site-nav" className="button" aria-haspopup="dialog" onClick={openMenu}>
          Menu
        </a>
      </div>

      <dialog ref={dialog} className="menu-overlay" aria-label="Site menu">
        <div className="menu-overlay__inner">
          <button type="button" className="button button--ghost menu-overlay__close" onClick={close}>
            Close
          </button>
          <nav aria-label="Menu">
            <ul className="menu-overlay__list">
              <li style={{ '--i': 0 }}>
                <Link to="/" onClick={close}>
                  Flight Deck
                </Link>
              </li>
              {destinations.map((d, i) => (
                <li key={d.id} style={{ '--i': i + 1 }}>
                  <Link to={d.path} onClick={close}>
                    {d.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="cta-row">
            <Link className="button button--gold" to="/join" onClick={close}>
              Join the team
            </Link>
            <Link className="button" to="/sponsors" onClick={close}>
              Sponsor a launch
            </Link>
          </div>
        </div>
      </dialog>
    </header>
  )
}
