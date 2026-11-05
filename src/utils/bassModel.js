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
 * With `rowEndTime(row)` and the row `width`, a note that wraps is closed at
 * the row's right edge and reopened at the next row's left edge (midi
 * interpolated at the boundary); a note ending exactly on a boundary leaves no
 * stub. Every segment has at least two points.
 */
export function noteSegments(note, timeToPixels, rowEndTime = null, width = null) {
  const pts = (note.contour?.length ? note.contour : [[note.start, note.midi]]).filter(([t]) => t >= note.start - 1e-6 && t <= note.end + 1e-6);
  if (!pts.length || pts[0][0] > note.start) pts.unshift([note.start, pts[0]?.[1] ?? note.midi]);
  if (pts[pts.length - 1][0] < note.end) pts.push([note.end, pts[pts.length - 1][1]]);
  const segs = [];
  let cur = null, prevT = null, prevMidi = null;
  for (const [t, midi] of pts) {
    const { x, row } = timeToPixels(t);
    if (cur && row !== cur.row && rowEndTime && width != null) {
      // close each crossed row at its right edge, reopen at the next row's left edge
      while (cur.row < row) {
        const tb = rowEndTime(cur.row);
        const f = t > prevT ? Math.max(0, Math.min(1, (tb - prevT) / (t - prevT))) : 0;
        const mb = prevMidi + f * (midi - prevMidi);
        cur.points.push({ x: width, midi: mb });
        cur = { row: cur.row + 1, points: [{ x: 0, midi: mb }], boundaryOnly: true };
        segs.push(cur);
      }
    } else if (!cur || row !== cur.row) {
      cur = { row, points: [] };
      segs.push(cur);
    }
    if (!(cur.boundaryOnly && x <= 1e-6 && cur.points.length === 1)) cur.points.push({ x, midi });
    if (x > 1e-6) cur.boundaryOnly = false;
    prevT = t; prevMidi = midi;
  }
  const out = segs.filter((sg) => !(sg.boundaryOnly && sg.points.every((p) => p.x <= 1e-6)));
  for (const sg of out) {
    delete sg.boundaryOnly;
    if (sg.points.length === 1) sg.points.push({ x: sg.points[0].x + 1, midi: sg.points[0].midi });
  }
  return out;
}

/**
 * Toppers that follow a note's line: the strip is cut into slices `dx` px
 * wide, each placed at the line's height at its middle. P = [[x, y], ...]
 * pixels, x increasing. Returns [{ x, w, y, u0, du }] where u0/du is the
 * slice's share of the glyph (0..1). A flat note is one slice.
 */
export function topperSlices(P, dx = 3) {
  const x0 = P[0][0], x1 = P[P.length - 1][0], W = Math.max(1e-6, x1 - x0);
  const ys = P.map((p) => p[1]);
  if (Math.max(...ys) - Math.min(...ys) < 0.5) return [{ x: x0, w: x1 - x0, y: P[0][1], u0: 0, du: 1 }];
  const yAt = (x) => {
    let i = 0;
    while (i < P.length - 2 && P[i + 1][0] < x) i++;
    const [ax, ay] = P[i], [bx, by] = P[i + 1];
    return bx > ax ? ay + ((Math.max(ax, Math.min(bx, x)) - ax) / (bx - ax)) * (by - ay) : ay;
  };
  const out = [];
  for (let x = x0; x < x1 - 1e-6; x += dx) {
    const w = Math.min(dx, x1 - x);
    out.push({ x, w, y: yAt(x + w / 2), u0: (x - x0) / W, du: w / W });
  }
  return out;
}
