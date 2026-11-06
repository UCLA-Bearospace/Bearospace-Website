// One place for the timing of the whole site, so the camera, the wipe, and page
// entrances feel like the same physics. Ported from the portfolio's timing.js;
// easings are CSS strings here because the wipe runs on the Web Animations API.

export const AXIS_DEG = 14 // the "ascent axis" accents lean on (upward, unlike the portfolio's -14)

export const EASE = {
  sweepIn: 'cubic-bezier(0.7, 0, 0.84, 0)', // ~ power4.in
  sweepOut: 'cubic-bezier(0.16, 1, 0.3, 1)', // ~ power3.out
  fade: 'cubic-bezier(0.4, 0, 0.6, 1)',
}

export const WIPE = { cover: 340, hold: 100, reveal: 360, stagger: 50 }
export const PAGE_FADE = 250 // the page steps aside while the camera travels
export const REDUCED = { out: 80, in: 150 } // reduced motion: a quick fade instead

// Page entrance after the wipe clears
export const ENTER = { delay: 120, stagger: 60, duration: 420 }
