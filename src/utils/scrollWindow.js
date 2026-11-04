// src/utils/scrollWindow.js
// The scroll time layout's window arithmetic, ported from the Line Staff
// prototype (new-prototypes/line-staff): everything in content pixels.
//   - following: the window scrolls so the playhead sits LEAD across it
//   - frozen: the window stays where the user left it (drag to scrub)
//   - reveal: while following and playing, only what the playhead has
//     passed is shown (an inset from the right edge of the content)

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
