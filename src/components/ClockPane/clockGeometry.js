// src/components/ClockPane/clockGeometry.js
// The Rhyme Clock's geometry: rings (index 0 is the outermost, later cycles
// further in), the window of cycles shown (W = the cycle on the outermost
// ring), the current ring (the playhead's), arcs, and pointer hits.
// Fractions of a turn start at 12 o'clock and run clockwise.

export const RINGS_OPTIONS = [1, 2, 4, 8, 16, 32, "all"];
export const CYCLE_OPTIONS = [1, 2, 4];
/** Segmented options for the rings-shown lever. */
export const RINGS_SEG = RINGS_OPTIONS.map((r) => ({ value: r, label: String(r) }));

const TAU = Math.PI * 2;

/** Rings drawn: a number, or "all" = every cycle of the song (at least one). */
export function ringCount(ringsShown, cycleCount) {
  return ringsShown === "all" ? Math.max(1, cycleCount | 0) : Math.max(1, ringsShown | 0);
}

/** The current ring index kept within 0 … rings − 1. */
export function clampIndex(index, rings) {
  return Math.max(0, Math.min(Math.max(0, rings - 1), Math.round(index) || 0));
}

/** Radius of ring i: the rim at 0, rInner at rings − 1. */
export function ringRadius(i, rings, rOuter, rInner) {
  if (rings <= 1) return rOuter;
  return rOuter - (i * (rOuter - rInner)) / (rings - 1);
}

/** The gap between neighboring rings. */
export function ringSpacing(rings, rOuter, rInner) {
  return rings <= 1 ? rOuter - rInner : (rOuter - rInner) / (rings - 1);
}

/** Words carry text only while the rings are at least two text heights apart. */
export function showText(spacing, textPx) {
  return spacing >= 2 * textPx;
}

export function polar(cx, cy, r, frac) {
  const a = TAU * frac - Math.PI / 2;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** A clockwise SVG arc from frac f0 to f1 (f0 < f1 ≤ f0 + 1). */
export function arcPath(cx, cy, r, f0, f1) {
  const a = polar(cx, cy, r, f0);
  const span = Math.min(0.9999, f1 - f0);
  const b = polar(cx, cy, r, f0 + span);
  const large = span > 0.5 ? 1 : 0;
  return `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r.toFixed(2)},${r.toFixed(2)} 0 ${large} 1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`;
}

/** A word's time span cut at cycle boundaries: [{ cycle, f0, f1 }]. The intro (cycle −1) is dropped. */
export function wordSegments(start, end, cycles) {
  if (!cycles || cycles.count === 0) return [];
  const t0 = Math.max(start, cycles.start(0));
  if (!(end > t0)) return [];
  const c0 = cycles.cycleOf(t0);
  let c1 = cycles.cycleOf(end);
  let fEnd = cycles.fracOf(end);
  if (c1 > c0 && fEnd < 1e-6) { c1 -= 1; fEnd = 1; }   // ends exactly on a boundary
  const out = [];
  for (let c = c0; c <= c1; c++) {
    out.push({ cycle: c, f0: c === c0 ? cycles.fracOf(t0) : 0, f1: c === c1 ? fEnd : 1 });
  }
  return out;
}

/**
 * The window after a playhead update. W = the cycle on the outermost ring;
 * P = the playhead's cycle (−1 in the intro); index = the current ring's
 * chosen (Follow) or last (Freeze) position. current = the ring the playhead
 * is on, or null when it is not in view.
 */
export function syncWindow({ follow, W, P, index, rings, wholeSong }) {
  if (wholeSong) {
    const current = P >= 0 && P < rings ? P : null;
    return { W: 0, index: current ?? index, current };
  }
  if (follow) {
    return { W: Math.max(0, P) - index, index, current: P >= 0 ? index : null };
  }
  const k = P - W;
  if (P >= 0 && k >= 0 && k < rings) return { W, index: k, current: k };
  return { W, index, current: null };
}

/** The window that puts the playhead's cycle on ring `index`. */
export function windowForIndex(P, index) {
  return Math.max(0, P) - index;
}

/** A pointer at (x, y): its frac of the turn, the nearest ring, and its radius. */
export function pointerToClock(x, y, cx, cy, rings, rOuter, rInner) {
  const dx = x - cx, dy = y - cy;
  const r = Math.hypot(dx, dy);
  let frac = (Math.atan2(dy, dx) + Math.PI / 2) / TAU;
  frac = ((frac % 1) + 1) % 1;
  if (frac > 1 - 1e-9) frac = 0;
  const sp = ringSpacing(rings, rOuter, rInner);
  const ring = rings <= 1 ? 0 : clampIndex((rOuter - r) / sp, rings);
  return { frac, ring, r };
}

/** The change from one frac to the next, taking the short way round (−0.5, 0.5]. */
export function unwrapDelta(prevFrac, frac) {
  let d = frac - prevFrac;
  if (d > 0.5) d -= 1;
  if (d <= -0.5) d += 1;
  return d;
}
