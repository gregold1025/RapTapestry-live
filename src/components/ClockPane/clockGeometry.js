// src/components/ClockPane/clockGeometry.js
// The Rhyme Clock's geometry: rings (index 0 is the outermost, later cycles
// further in), the window of cycles shown (W = the cycle on the outermost
// ring), the current ring (the playhead's), arcs, and pointer hits.
// Fractions of a turn start at 12 o'clock and run clockwise.

import { gridStrokes, contrastRatio } from "../../utils/gridStroke";

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

/** One spoke per beat of the cycle; "bar" where a bar starts. */
export function spokes(cycleBars, beatsPerBar) {
  const bpb = Math.max(1, beatsPerBar | 0), n = Math.max(1, cycleBars | 0) * bpb;
  return Array.from({ length: n }, (_, j) => ({ frac: j / n, kind: j % bpb === 0 ? "bar" : "beat" }));
}

const hex2 = (v) => Math.round(v).toString(16).padStart(2, "0");
/** The background pushed toward black or white (whichever contrasts more) until it reaches `target` contrast. */
function pushed(background, target) {
  let h = String(background ?? "").trim();
  if (/^#[0-9a-f]{3}$/i.test(h)) h = "#" + [...h.slice(1)].map((c) => c + c).join("");
  if (!/^#[0-9a-f]{6}$/i.test(h)) h = "#ffffff";
  const bg = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const pole = contrastRatio(h, "#ffffff") >= contrastRatio(h, "#000000") ? 255 : 0;
  for (let a = 0; a <= 1.0001; a += 0.01) {
    const c = "#" + bg.map((v) => hex2(v + (pole - v) * Math.min(1, a))).join("");
    if (contrastRatio(c, h) >= target) return c;
  }
  return pole ? "#ffffff" : "#000000";
}

/** Spoke and ring colors for a background, the same pushes as bar and beat lines; the current ring also glows. */
export function faceStrokes(background) {
  const g = gridStrokes(background);
  return { bar: g.bar, beat: g.beat, ring: g.beat, current: g.bar, glow: pushed(background, 4.5) };
}

/** The clock's radii for a square of `side` px: rim, inner hole, drum band. */
export function clockGeo(side, rings) {
  const cx = side / 2, cy = side / 2;
  const rOuter = Math.max(20, (side / 2 - 8) / 1.12);
  return { cx, cy, rOuter, rInner: 0.18 * rOuter, drumBand: 0.12 * rOuter, rings };
}

/** The faint preview's opacity (later rings, and the unplayed part of the current ring, while following). */
export const FAINT = 0.18;

/** A mark's opacity: faint while following and playing if the playhead has not reached it yet. */
export function revealOpacity({ follow, playing, ring, current, start, t }) {
  if (!follow || !playing) return 1;
  if (current == null) return FAINT;
  if (ring > current) return FAINT;
  if (ring === current && start > t) return FAINT;
  return 1;
}

/** What a drag does: pan through the song, or nothing in whole-song mode (every cycle has its ring). */
export function dragMode({ wholeSong }) {
  return wholeSong ? null : "pan";
}

/**
 * A radial drag in cycles: the pointer's travel along the line from the
 * center through where the drag started, one cycle per ring gap. Outward is
 * later in the song (+), inward earlier (−), and it keeps counting past the
 * center, so one long inward drag can reach the start of the song.
 */
export function radialPan({ cx, cy, x0, y0, x, y, spacing }) {
  let ux = x0 - cx, uy = y0 - cy;
  const len = Math.hypot(ux, uy);
  if (len < 1e-6) { ux = 0; uy = -1; } else { ux /= len; uy /= len; }
  const d = (x - x0) * ux + (y - y0) * uy;
  return Math.round(d / Math.max(1, spacing)) || 0;
}

/** The window kept on the song with every ring full: from the first cycle on the rim to the last on the innermost ring. */
export function clampWindow(W, rings, count) {
  return Math.max(0, Math.min(Math.max(0, count - rings), W));
}

/**
 * The window after the cycle length or whole-song mode changes while frozen:
 * leaving whole song puts the playhead's ring at the chosen index; a new cycle
 * length keeps the outermost ring at the same place in the song.
 */
export function reanchorWindow({ W, oldCycles, newCycles, P, index, rings, leftWholeSong }) {
  if (leftWholeSong) return windowForIndex(P, clampIndex(index, rings));
  if (!oldCycles || !newCycles || newCycles.count === 0) return W;
  const t = oldCycles.start(Math.max(0, W));
  return clampWindow(Math.max(0, newCycles.cycleOf(t)), rings, newCycles.count);
}

/** The cycle a background click seeks in: its ring's, or in the drum band the drums' (the current ring's). */
export function clickCycle({ r, ring, W, current, rOuter, drumBand }) {
  if (r > rOuter + drumBand) return null;
  if (r > rOuter + 3) return current == null ? null : W + current;
  return W + ring;
}

/** The drum glyphs' color on the clock: the Drums panel's, unless it would vanish on the background (contrast < 2). */
export function drumInk(fill, background, fallback) {
  return contrastRatio(fill, background) < 2 ? fallback : fill;
}

/** A word label's path: clockwise along the ring just outside it, from the word's start (upside down on the lower half). */
export function labelArc(cx, cy, r, f0, f1, text, fs) {
  const span = Math.min(0.5, Math.max(f1 - f0, (text.length * fs * 0.6 + 4) / (TAU * r)));
  return arcPath(cx, cy, r + 3, f0, f0 + span);
}


/** Where Follow keeps the playhead's ring: the middle ring, or with an even count the larger (outer) of the two middle rings. */
export function followIndex(rings) {
  return Math.max(0, Math.ceil(Math.max(1, rings | 0) / 2) - 1);
}
