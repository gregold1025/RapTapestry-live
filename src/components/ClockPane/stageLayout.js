// src/components/ClockPane/stageLayout.js
// The band under the tapestry that holds the Line Staff and the Rhyme Clock:
// the Line Staff's original height (44% of the stage). The clock takes a
// square of the band's height in the bottom-right corner (never more than
// half the width), the Line Staff the rest; without the Line Staff the clock
// keeps its corner; without the clock the Line Staff takes the whole band.

const BAND = 0.44;

export function stageLayout({ width, height, staffOpen, clockOpen }) {
  if (!(staffOpen || clockOpen) || !(width > 0) || !(height > 0)) return { bandH: 0, clockW: 0 };
  const bandH = Math.floor(height * BAND);
  return { bandH, clockW: clockOpen ? Math.min(bandH, Math.floor(width / 2)) : 0 };
}
