import PageFrame from '../components/PageFrame'
import Img from '../components/Img'
import { Sources } from '../components/bits'
import { SOURCES, gallery, seasonLabel } from '../content/index.js'

const CATEGORY = { launch: 'Launch', build: 'Build', 'team-life': 'Team life', lab: 'Lab' }

export default function Gallery() {
  return (
    <PageFrame
      kicker="Gallery"
      title="Launch days and lab nights"
      lede="Behind every launch are countless hours of design reviews, manufacturing sessions, testing, and problem-solving — and the friendships formed along the way."
      wide
    >
      <ul className="gallery">
        {gallery.map((g) => (
          <li key={g.src}>
            <figure>
              <Img src={g.src} alt={g.alt} sizes="(min-width: 70rem) 22rem, (min-width: 40rem) 45vw, 100vw" />
              <figcaption>
                {g.caption && <span>{g.caption} </span>}
                <span className="note">
                  {CATEGORY[g.category]}
                  {g.season && ` · ${seasonLabel(g.season)}`}
                  {g.date && ` · ${g.date}`}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <Sources items={[SOURCES.sitePhotos]} />
    </PageFrame>
  )
}
