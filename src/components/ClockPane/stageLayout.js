// src/components/ClockPane/stageLayout.js
// The band under the tapestry that holds the Line Staff and the Rhyme Clock:
// the Line Staff's original height (44% of the stage). The clock is a square
// of that size (never more than half the width) in the stage's bottom-right
// corner: with the Line Staff it sits at the band's right end and the Line
// Staff takes the rest; without the Line Staff there is no band, so the
// tapestry runs the full height under the clock (Greg, 2026-11-06).

const BAND = 0.44;

export function stageLayout({ width, height, staffOpen, clockOpen }) {
  if (!(staffOpen || clockOpen) || !(width > 0) || !(height > 0)) return { bandH: 0, clockW: 0 };
  const side = Math.floor(height * BAND);
  const clockW = clockOpen ? Math.min(side, Math.floor(width / 2)) : 0;
  return { bandH: staffOpen ? side : 0, clockW };
}
