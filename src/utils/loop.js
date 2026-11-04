// src/utils/loop.js
// The loop section: a [start, end] time range the transport cycles while the
// loop is on. Play always starts at the loop start.
export const MIN_LOOP = 0.25; // seconds

export function normalizeLoop({ start, end }, duration) {
  const d = Math.max(0, duration || 0);
  let a = Math.max(0, Math.min(d, Math.min(start, end)));
  let b = Math.max(0, Math.min(d, Math.max(start, end)));
  if (b - a < MIN_LOOP) {
    b = Math.min(d, a + MIN_LOOP);
    a = Math.max(0, b - MIN_LOOP);
  }
  return { start: a, end: b };
}

/** Four bars from the bar under the playhead (clamped to the song, still four bars when possible). */
export function defaultLoop(t, song, bars = 4) {
  const { grid, beatsPerBar, duration } = song;
  const barStart = (b) => grid[Math.min(grid.length - 1, Math.max(0, b * beatsPerBar))] ?? duration;
  const numBars = Math.floor((grid.length - 1) / beatsPerBar);
  let b0 = Math.max(0, song.barPosition(t).bar);
  b0 = Math.max(0, Math.min(b0, numBars - bars));
  const b1 = Math.min(numBars, b0 + bars);
  return normalizeLoop({ start: barStart(b0), end: b1 >= numBars ? duration : barStart(b1) }, duration);
}

/** Dragging one edge: the other edge stays put; crossing it swaps roles. */
export function dragLoopEdge(fixedEdge, t, duration) {
  return normalizeLoop({ start: fixedEdge, end: t }, duration);
}
