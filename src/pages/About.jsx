import { Link } from 'react-router'
import PageFrame from '../components/PageFrame'
import { Sources } from '../components/bits'
import { Portrait } from '../components/people'
import { SOURCES, divisions, getPerson, org } from '../content/index.js'

const LIFECYCLE = [
  ['Concept', 'Set the mission and requirements for the season’s vehicle and payload.'],
  ['Design reviews', 'Defend the design in technical reviews before anything is built.'],
  ['Manufacturing', 'Lay up composites, machine hardware, and build every part by hand.'],
  ['Integration', 'Bring the airframe, recovery, avionics, and payload together as one vehicle.'],
  ['Ground testing', 'Prove recovery charges, electronics, and mechanisms on the ground.'],
  ['Launch', 'Fly the rocket — at competition and at team launches.'],
  ['Post-flight analysis', 'Read the data, find what worked, and carry the lessons forward.'],
]

export default function About() {
  const pms = ['bianca-vasquez', 'emmanuel-jaimes'].map(getPerson)
  return (
    <PageFrame kicker="About" title="Built by students. Flown for real." lede={org.mission}>
      <p>
        Bearospace is a student-led aerospace engineering program at UCLA. Every year our members take a high-power rocket
        from a blank CAD file to the launch rail — designing it, defending it in technical reviews, building it by hand,
        testing it on the ground, flying it, and learning from the data. Our structure mirrors a professional aerospace
        program, so members grow as engineers and as leaders while contributing to one integrated flight vehicle.
      </p>

      <h2>How a Bearospace rocket comes together</h2>
      <ol className="steps">
        {LIFECYCLE.map(([name, text]) => (
          <li key={name}>
            <strong>{name}.</strong> {text}
          </li>
        ))}
      </ol>

      <h2>Organized like an aerospace program</h2>
      <p>Members work across four divisions, each with its own leads:</p>
      <ul className="cards cards--compact">
        {divisions.map((d) => (
          <li key={d.id} className="card">
            <h3>{d.name}</h3>
            <p>{d.summary}</p>
          </li>
        ))}
      </ul>
      <p>
        <Link to="/engineering">Explore the engineering disciplines</Link>
      </p>

      <h2>Rooted in AISES at UCLA</h2>
      <p>
        Bearospace is the technical project of the UCLA chapter of the {org.parents.aises.full.split(',')[0]} (AISES). The
        chapter is part of UCLA Samueli’s {org.parents.ceed.full} ({org.parents.ceed.name}).
      </p>
      <p>
        We exist to widen the door into hands-on aerospace: to recruit through cultural and campus communities, and to make
        sure students who have never touched a power tool get the same chance to build flight hardware as those who have.
      </p>

      <h2>A note from our Project Managers</h2>
      <figure className="welcome">
        <div className="welcome__portraits">
          {pms.map((p) => (
            <Portrait key={p.slug} person={p} />
          ))}
        </div>
        <blockquote>
          <p>
            Welcome to Bearospace! We believe the best way to learn aerospace engineering is to build aerospace systems.
            Whether you’re an experienced engineer or a first-year who has never opened a CAD program, there’s a place for
            you here — on our Vehicle, Avionics, Payload, or Operations teams, from first concept to post-flight analysis.
          </p>
          <p>
            The friendships, mentorship, and connections you make here matter as much as the rockets we launch. Our goal is
            a team where everyone can grow technically, professionally, and personally. Explore our work, meet the team, and
            follow the journey.
          </p>
        </blockquote>
        <figcaption>
          <Link to="/team/bianca-vasquez">Bianca Vasquez</Link> & <Link to="/team/emmanuel-jaimes">Emmanuel Jaimes</Link>,
          Project Managers 2026–27
        </figcaption>
      </figure>

      <div className="cta-band">
        <p>Want to build flight hardware?</p>
        <Link className="button button--gold" to="/join">
          Join the team
        </Link>
      </div>

      <Sources items={[SOURCES.site, SOURCES.siteAbout, SOURCES.aises, SOURCES.oldSite]} />
    </PageFrame>
  )
}
