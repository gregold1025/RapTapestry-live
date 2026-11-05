// src/utils/bassModel.js
// Bass v2 (experiments/bass-01: pYIN F0 contour + onsets): each note has a
// start, end, fractional midi and a contour [[t, midi], ...]. Drawn as a
// spline through its contour, its height = pitch within the song's range.

/** The song's note pitch range (5th..95th percentile), padded by a semitone. */
export function bassRange(notes) {
  const v = (notes ?? []).map((n) => n.midi).filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return { lo: 24, hi: 48 };
  const at = (i) => v[Math.min(v.length - 1, Math.max(0, i))];
  const lo = at(Math.floor(0.05 * (v.length - 1))) - 1, hi = at(Math.ceil(0.95 * (v.length - 1))) + 1;
  return hi > lo ? { lo, hi } : { lo: lo - 1, hi: hi + 1 };
}

/** midi -> percent of the lane inside `band`; null -> the middle; clamps. */
export function midiPct(midi, band, range) {
  const span = Math.max(1e-9, range.hi - range.lo);
  const f = Number.isFinite(midi) ? Math.max(0, Math.min(1, (midi - range.lo) / span)) : 0.5;
  return band.lo + f * (band.hi - band.lo);
}

/**
 * A note's contour cut at row boundaries: [{ row, points: [{ x, midi }] }].
 * Every segment has at least two points (start and end of the note on that row).
 */
export function noteSegments(note, timeToPixels) {
  const pts = (note.contour?.length ? note.contour : [[note.start, note.midi]]).filter(([t]) => t >= note.start - 1e-6 && t <= note.end + 1e-6);
  if (!pts.length || pts[0][0] > note.start) pts.unshift([note.start, pts[0]?.[1] ?? note.midi]);
  if (pts[pts.length - 1][0] < note.end) pts.push([note.end, pts[pts.length - 1][1]]);
  const segs = [];
  let cur = null;
  for (const [t, midi] of pts) {
    const { x, row } = timeToPixels(t);
    if (!cur || row !== cur.row) {
      if (cur && cur.points.length === 1) cur.points.push({ x: cur.points[0].x + 1, midi: cur.points[0].midi });
      cur = { row, points: [] };
      segs.push(cur);
    }
    cur.points.push({ x, midi });
  }
  if (cur && cur.points.length === 1) cur.points.push({ x: cur.points[0].x + 1, midi: cur.points[0].midi });
  return segs;
}
