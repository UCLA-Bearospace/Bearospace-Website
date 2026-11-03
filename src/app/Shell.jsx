import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import FlightBackdrop from './FlightBackdrop'
import Header from './Header'
import Footer from './Footer'
import { Announcer, RouteMeta, ScrollManager } from './navigation'
import { useMotionAllowed } from '../motion/useMotionPref'

/** Layout for every route: the flying rocket behind, page content in front. */
export default function Shell() {
  const motion = useMotionAllowed()
  const { pathname } = useLocation()
  const home = pathname === '/'

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <FlightBackdrop motion={motion} dimmed={!home} />
      <div className="stage" data-home={home || undefined}>
        <Header />
        <main id="main" tabIndex={-1}>
          {/* Page chunks load lazily; the prerendered page stays visible meanwhile */}
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
      <RouteMeta />
      <ScrollManager />
      <Announcer />
    </>
  )
}
