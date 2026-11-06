// src/components/ClockPane/stageLayout.js
// The band under the tapestry that holds the Line Staff and the Rhyme Clock:
// half as tall as it is wide, so with both open each half is a square (the
// clock in the bottom-right corner, the Line Staff to its left). Without the
// Line Staff the clock keeps its square in the corner; without the clock the
// Line Staff takes the whole band. The tapestry keeps at least 30% of the stage.

const MIN_TOP = 140;   // px the tapestry keeps, at least

export function stageLayout({ width, height, staffOpen, clockOpen }) {
  if (!(staffOpen || clockOpen) || !(width > 0) || !(height > 0)) return { bandH: 0, clockW: 0 };
  const bandH = Math.max(0, Math.floor(Math.min(width / 2, height - Math.max(MIN_TOP, 0.3 * height))));
  return { bandH, clockW: clockOpen ? Math.min(bandH, Math.floor(width / 2)) : 0 };
}
