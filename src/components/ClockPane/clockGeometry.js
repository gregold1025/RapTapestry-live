// src/components/ClockPane/clockGeometry.js
// The Rhyme Clock's geometry. The song is one spiral, a turn per cycle.
// Everything is placed by its song position u = cycle + frac: its angle is
// frac (from 12 o'clock, clockwise) and never changes; its radius is set by
// v = u − W, how far it is from the spiral's outer end. W (the window, in
// cycles, fractional) is the song position at the outer end: in Follow it
// moves with the playhead, so the spiral expands outward without turning and
// its two ends (opacity fades) sweep round with the playhead.

import { gridStrokes, contrastRatio, inkOn } from "../../utils/gridStroke";

export const RINGS_OPTIONS = [1, 2, 4, 8, 16, 32, "all"];
export const CYCLE_OPTIONS = [1, 2, 4];
/** Segmented options for the rings-shown lever. */
export const RINGS_SEG = RINGS_OPTIONS.map((r) => ({ value: r, label: String(r) }));
/** Drop-down options for the rings-shown lever in the clock's own bar (Greg 2026-11-09: room for its buttons). */
// the button row (when the bar has room) and the drop-down (when it does not) (Greg 2026-11-09)
export const RINGS_PICK = RINGS_OPTIONS.map((r) => ({ value: r, label: String(r), menuLabel: r === "all" ? "all rings" : `${r} ring${r === 1 ? "" : "s"}` }));
export const RINGS_MENU = RINGS_OPTIONS.map((r) => ({ value: String(r), label: r === "all" ? "all rings" : `${r} ring${r === 1 ? "" : "s"}` }));
/** The clock's place text: the cycles in view (no "frozen": the Follow button says it). */
export const cyclesLabel = (count, Wi, rings) => (count ? `cycles ${Math.max(1, Wi + 1)}–${Math.min(count, Wi + rings)}` : "");
/** A <select> hands back strings: "8" -> 8, "all" -> "all". */
export const ringsFromMenu = (v) => (v === "all" ? "all" : Number(v));

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Rings drawn: a number, or "all" = every cycle of the song (at least one). */
export function ringCount(ringsShown, cycleCount) {
  return ringsShown === "all" ? Math.max(1, cycleCount | 0) : Math.max(1, ringsShown | 0);
}

/**
 * The spiral's outer radius r0 and how far it moves in per turn. Its inner
 * end: one ring at two thirds of the radius (starting a little inside the
 * rim), two rings at a third, more at the inner hole.
 */
export function spiralShape(rings, rOuter, rInner) {
  const r0 = rings <= 1 ? 0.9 * rOuter : rOuter;
  const rEnd = rings <= 1 ? (2 / 3) * rOuter : rings === 2 ? rOuter / 3 : rInner;
  return { r0, pitch: (r0 - rEnd) / Math.max(1, rings) };
}

/** The gap between neighboring turns. */
export function ringPitch(rings, rOuter, rInner) {
  return spiralShape(rings, rOuter, rInner).pitch;
}

/** The spiral's radius v turns in from its outer end (never below 0). */
export function radiusAt(v, rings, rOuter, rInner) {
  const { r0, pitch } = spiralShape(rings, rOuter, rInner);
  return Math.max(0, r0 - v * pitch);
}

const STEP = 1 / 180;   // the spiral is drawn in 2° steps

/** The spiral, clockwise, from song position u0 to u1 with the window at W, pushed out by `offset` px. */
export function spiralPath(cx, cy, u0, u1, W, rings, rOuter, rInner, offset = 0) {
  const n = Math.max(1, Math.ceil((u1 - u0) / STEP));
  let d = "";
  for (let j = 0; j <= n; j++) {
    const u = u0 + ((u1 - u0) * j) / n;
    const p = polar(cx, cy, radiusAt(u - W, rings, rOuter, rInner) + offset, u - Math.floor(u));
    d += `${j ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }
  return d;
}

/** Where a label's stretch ends: at least the word, long enough for `textLen` px at its radius, at most half a turn. */
export function labelSpan(u0, u1, W, textLen, rings, rOuter, rInner) {
  const r = Math.max(1, radiusAt(u0 - W, rings, rOuter, rInner));
  return u0 + Math.min(0.5, Math.max(u1 - u0, textLen / (TAU * r)));
}

/** Words carry text only while the turns are at least two text heights apart. */
export function showText(spacing, textPx) {
  return spacing >= 2 * textPx;
}

export function polar(cx, cy, r, frac) {
  const a = TAU * frac - Math.PI / 2;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
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

/** The song position at time t: cycle + frac (0 before the first bar or without a bar grid). */
export function songPos(cycles, t) {
  if (!cycles || cycles.count === 0) return 0;
  const c = cycles.cycleOf(t);
  return c < 0 ? 0 : c + cycles.fracOf(t);
}

// The drum rim's glow (Greg 2026-11-09): a hit has no end, so it is current from its onset until
// the next onset, at most DRUM_GLOW_HOLD seconds; hits within DRUM_TOGETHER glow together.
export const DRUM_GLOW_HOLD = 0.2;
export const DRUM_TOGETHER = 0.03;

/** The onset times (sorted) that glow at time t, as { from, to }; null when none does. */
export function drumGlowRange(times, t) {
  let lo = 0, hi = (times?.length ?? 0) - 1, i = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (times[m] <= t) { i = m; lo = m + 1; } else hi = m - 1; }
  if (i < 0 || t - times[i] >= DRUM_GLOW_HOLD) return null;
  return { from: times[i] - DRUM_TOGETHER, to: times[i] };
}

/** The timing model's words (a Map by id) as a list ordered by start time. */
export const wordsByTime = (map) => (map ? [...map.values()].sort((a, b) => a.start - b.start) : []);

/** The index of the word sounding at time t (start <= t < end) in time-sorted words; -1 in a gap. */
export function wordAt(words, t) {
  let lo = 0, hi = (words?.length ?? 0) - 1, i = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (words[m].start <= t) { i = m; lo = m + 1; } else hi = m - 1; }
  return i >= 0 && t < words[i].end ? i : -1;
}

/** The stretch of spiral the glowing word covers, clipped to the visible turns [W, W + rings]; null if none. */
export function wordGlowSpan({ word, cycles, W, rings }) {
  if (!word) return null;
  const u0 = Math.max(songPos(cycles, word.start), W), u1 = Math.min(songPos(cycles, word.end), W + rings);
  return u1 > u0 ? { u0, u1 } : null;
}

/** The time at song position u. */
export function timeAtPos(cycles, u) {
  const c = Math.max(0, Math.floor(u));
  return cycles.timeAt(c, Math.max(0, u - c));
}

/** Where Follow keeps the playhead's ring: the middle ring, or with an even count the larger (outer) of the two middle rings. */
export function followIndex(rings) {
  return Math.max(0, Math.ceil(Math.max(1, rings | 0) / 2) - 1);
}

/** Where Follow keeps the playhead, in turns from the outer end: halfway round its ring. */
export function followAt(rings) {
  return followIndex(rings) + 0.5;
}

/** The window for playhead position U: Follow keeps the playhead at followAt; Freeze holds W; whole song starts at 0. */
export function syncWindow({ follow, W, U, rings, wholeSong }) {
  if (wholeSong) return 0;
  if (follow) return U - followAt(rings);
  return W;
}

/**
 * The window kept on the song while panning: from the first cycle at the
 * outer end to the last at the inner end; a pan that starts outside those
 * bounds (Follow near the start or end) may stay where it started.
 */
export function clampWindow(W, rings, count, from = null) {
  let lo = 0, hi = Math.max(0, count - rings);
  if (from != null) { lo = Math.min(lo, from); hi = Math.max(hi, from); }
  return Math.max(lo, Math.min(hi, W));
}

/**
 * The window after the cycle length or whole-song mode changes while frozen:
 * leaving whole song puts the playhead where Follow would; a new cycle length
 * keeps the outer end at the same place in the song.
 */
export function reanchorWindow({ W, oldCycles, newCycles, U, rings, leftWholeSong }) {
  if (leftWholeSong) return U - followAt(rings);
  if (!oldCycles || !newCycles || newCycles.count === 0 || oldCycles.count === 0) return W;
  const t = timeAtPos(oldCycles, Math.max(0, W));
  return clampWindow(songPos(newCycles, t), rings, newCycles.count);
}

/** A pointer at (x, y): its frac of the turn, the song position on the nearest turn at that angle, and its radius. */
export function pointerToSong(x, y, cx, cy, W, rings, rOuter, rInner) {
  const dx = x - cx, dy = y - cy;
  const r = Math.hypot(dx, dy);
  let frac = (Math.atan2(dy, dx) + Math.PI / 2) / TAU;
  frac = ((frac % 1) + 1) % 1;
  if (frac > 1 - 1e-9) frac = 0;
  const { r0, pitch } = spiralShape(rings, rOuter, rInner);
  const v = (r0 - r) / Math.max(1e-6, pitch);
  return { frac, u: frac + Math.round(W + v - frac), r };
}

/**
 * Where a plain click on the background seeks: the clicked place on the
 * spiral, or in the drum band the same angle in the playhead's cycle P (the
 * drums' cycle). Null outside the clock, off the spiral's visible stretch, or
 * outside the song.
 */
export function clickTarget({ r, u, frac, W, rings, P, count, rOuter, drumBand }) {
  if (r > rOuter + drumBand) return null;
  if (r > rOuter + 3) return P == null || P < 0 ? null : { cycle: P, frac };
  if (u < W - 1e-6 || u > W + rings + 1e-6 || u < 0 || u >= count) return null;
  return { cycle: Math.floor(u), frac };
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

/** Spoke and spiral colors for a background, the same pushes as bar and beat lines; the current cycle also glows. */
export function faceStrokes(background) {
  const g = gridStrokes(background);
  return { bar: g.bar, beat: g.beat, ring: g.beat, current: g.bar, glow: pushed(background, 4.5) };
}

/** How far (turns) the spiral fades at each end. */
export function fadeLen(rings) {
  return Math.min(0.35, rings * 0.25);
}

/** Opacity at v turns from the outer end: fading in over the last F turns at each end. */
export function endFade(v, rings, F) {
  if (!(F > 0)) return 1;
  return clamp01(v / F) * clamp01((rings - v) / F);
}

/** The spiral's line from W to W + rings: n fading pieces at each end (F turns long) and a solid body. */
export function facePieces(W, rings, F, n = 8) {
  if (!(F > 0)) return [{ u0: W, u1: W + rings, alpha: 1 }];
  const out = [];
  for (let k = 0; k < n; k++) out.push({ u0: W + (F * k) / n, u1: W + (F * (k + 1)) / n, alpha: (k + 0.5) / n });
  out.push({ u0: W + F, u1: W + rings - F, alpha: 1 });
  for (let k = 0; k < n; k++) out.push({ u0: W + rings - F + (F * k) / n, u1: W + rings - F + (F * (k + 1)) / n, alpha: (n - k - 0.5) / n });
  return out;
}

/** The drum band outside the rim (px): room for the largest glyph and the spread by class height. */
const DRUM_BAND = 36;
/** Drum glyphs on the clock: a fixed scale of the Drums panel's per-class sizes (150% of the sizes at 80%). */
export const DRUM_GLYPH_SCALE = 1.5 * 0.8;

/** The clock's radii for a square of `side` px: rim, inner hole, and the drum band, which fits inside the window. */
export function clockGeo(side, rings) {
  const cx = side / 2, cy = side / 2;
  const rOuter = Math.max(20, side / 2 - 6 - DRUM_BAND);
  return { cx, cy, rOuter, rInner: 0.18 * rOuter, drumBand: DRUM_BAND, rings };
}

/** A drum glyph's center: just outside the rim, classes set higher in the Drums panel a little further out. */
export function drumRadius({ rOuter, size, height }) {
  return rOuter + 4 + size / 2 + (Math.max(0, Math.min(100, height)) / 100) * 30;
}

/** The faint preview's opacity (what the playhead has not reached, while following). */
export const FAINT = 0.18;

/** A mark's opacity: faint while following and playing if the playhead has not reached it yet. */
export function revealOpacity({ follow, playing, start, t }) {
  return follow && playing && start > t ? FAINT : 1;
}

/** A mark's opacity on the spiral: the reveal, times the fade at the spiral's ends (none in whole song). */
export function markOpacity({ follow, playing, start, t, umid, W, rings, wholeSong }) {
  const fade = wholeSong ? 1 : endFade(umid - W, rings, fadeLen(rings));
  return revealOpacity({ follow, playing, start, t }) * fade;
}

/** What a drag does: pan through the song, or nothing in whole-song mode (every cycle has its turn). */
export function dragMode({ wholeSong }) {
  return wholeSong ? null : "pan";
}

/**
 * A radial drag in cycles, continuous: the pointer's travel along the line
 * from the center through where the drag started, one cycle per turn gap.
 * Outward is later in the song (+), inward earlier (−), and it keeps counting
 * past the center, so one long inward drag can reach the start of the song.
 */
export function radialPan({ cx, cy, x0, y0, x, y, spacing }) {
  let ux = x0 - cx, uy = y0 - cy;
  const len = Math.hypot(ux, uy);
  if (len < 1e-6) { ux = 0; uy = -1; } else { ux /= len; uy /= len; }
  const d = (x - x0) * ux + (y - y0) * uy;
  return d / Math.max(1, spacing) || 0;
}

/** The drum glyphs' color on the clock: the Drums panel's, unless it would vanish on the background (contrast < 2). */
export function drumInk(fill, background, fallback) {
  return inkOn(fill, background, fallback);
}
