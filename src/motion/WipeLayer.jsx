/**
 * Three bands on the ascent axis that sweep across between pages (ported from the
 * portfolio). The middle band carries the destination's name, set imperatively by
 * TransitionProvider. Purely visual: hidden from assistive tech.
 */
export default function WipeLayer({ ref, labelRef }) {
  return (
    <div className="wipe" ref={ref} aria-hidden="true">
      <div className="wipe-rot">
        <div className="wipe-band wipe-band--a" />
        <div className="wipe-band wipe-band--b">
          <span className="wipe-label" ref={labelRef} />
        </div>
        <div className="wipe-band wipe-band--c" />
      </div>
    </div>
  )
}
