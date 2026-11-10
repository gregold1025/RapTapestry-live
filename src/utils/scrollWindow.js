// src/utils/scrollWindow.js
// The scroll time layout's window arithmetic, ported from the Line Staff
// prototype (new-prototypes/line-staff): everything in content pixels.
//   - following: the window scrolls so the playhead sits LEAD across it
//   - frozen: the window stays where the user left it (drag to scrub)
//   - reveal: while following and playing, only the glyphs the playhead has
//     passed are shown (an inset from the right edge of the content); the
//     bar and beat grid and the loop are always shown on both sides

export const LEAD = 2 / 3;

export function clampScroll(x, viewWidth, contentWidth) {
  const max = Math.max(0, contentWidth - viewWidth);
  return Math.max(0, Math.min(max, x));
}

export function followScroll(xPlayhead, viewWidth, contentWidth) {
  return clampScroll(xPlayhead - viewWidth * LEAD, viewWidth, contentWidth);
}

export function revealInset({ follow, playing, xPlayhead, contentWidth }) {
  if (!follow || !playing) return 0;
  return Math.max(0, contentWidth - xPlayhead);
}

/** Layers that are always shown, on both sides of the playhead (Greg, 2026-11-06): the grid and the loop. */
const ALWAYS_SHOWN = new Set(["grid", "loop"]);

/** Whether a layer (TapestryLayer's name) appears with the playhead while following and playing. */
export function revealsLayer(name) {
  return !ALWAYS_SHOWN.has(name);
}

/** The Line Staff's place text: the bars in view, plus "following" while it plays and follows (no "frozen": the Follow button says it). */
export const barsLabel = (lo, hi, follow, playing) => `bars ${lo}${hi > lo ? `–${hi}` : ""}${follow && playing ? " · following" : ""}`;
