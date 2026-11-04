// src/utils/laneLayout.js
// Stem lanes inside a tapestry row. Superimposed: every stem draws over the
// whole row. Separated: visible stems stack top-to-bottom in STEM_ORDER.
// Lane fractions are of the row height (0..1); heights inside a lane are
// percentages, 0 = lane bottom, 100 = lane top.

export const STEM_ORDER = ["drums", "vocals", "bass"];

const WHOLE = { top: 0, height: 1 };
const NONE = { top: 0, height: 0 };

export function computeLanes({ stemsLayout = "superimposed", order = STEM_ORDER, visible = {} }) {
  const out = {};
  if (stemsLayout !== "separated") {
    for (const s of order) out[s] = WHOLE;
    return out;
  }
  const shown = order.filter((s) => visible[s] !== false);
  if (shown.length === 0) {
    for (const s of order) out[s] = WHOLE;
    return out;
  }
  const h = 1 / shown.length;
  let top = 0;
  for (const s of order) {
    if (visible[s] === false) { out[s] = NONE; continue; }
    out[s] = { top, height: h };
    top += h;
  }
  return out;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Pixel y for `pct` (0 bottom .. 100 top) inside `lane` of a row starting at rowTop. */
export function laneY(rowTop, rowHeight, lane, pct) {
  const laneTop = rowTop + lane.top * rowHeight;
  const laneH = lane.height * rowHeight;
  return laneTop + (1 - clamp(pct, 0, 100) / 100) * laneH;
}

const FULL_RANGE = { lo: 0, hi: 1 };

/**
 * Map a centroid into a {lo, hi} percent band. `range` is the song's
 * centroid spread (see centroidRange); values outside it clamp to the band.
 */
export function pitchPct(c, band, range = FULL_RANGE) {
  const span = Math.max(1e-9, range.hi - range.lo);
  const v = clamp((Number.isFinite(c) ? c : (range.lo + range.hi) / 2) - range.lo, 0, span) / span;
  return band.lo + (band.hi - band.lo) * v;
}

/**
 * The 5th..95th percentile of every centroid value in the song, so that a
 * song whose centroids cluster (e.g. 0.85..0.9) still spreads over the band.
 */
export function centroidRange(transcription) {
  const vals = [];
  for (const line of transcription?.lines ?? []) {
    for (const w of line.words ?? []) {
      if (!Array.isArray(w.centroid)) continue;
      for (const c of w.centroid) if (Number.isFinite(c)) vals.push(c);
    }
  }
  if (vals.length < 2) return FULL_RANGE;
  vals.sort((a, b) => a - b);
  const at = (q) => vals[Math.min(vals.length - 1, Math.max(0, Math.round(q * (vals.length - 1))))];
  const lo = at(0.05), hi = at(0.95);
  return hi > lo ? { lo, hi } : FULL_RANGE;
}

/** Percent height for a word rectangle given its mode. */
export function wordPitchCenter(word, mode, band, center, range = FULL_RANGE) {
  if (mode !== "pitched" && mode !== "perSyllable") return center;
  const c = Array.isArray(word?.centroid) ? word.centroid[0] : undefined;
  if (!Number.isFinite(c)) return center;
  return pitchPct(c, band, range);
}

/** Percent height for syllable `si` of `nSyllables` (same centroid sampling as before). */
export function syllablePitchPct(word, si, nSyllables, band, fallbackPct, range = FULL_RANGE) {
  const centroids = Array.isArray(word?.centroid) ? word.centroid : [];
  if (!centroids.length) return fallbackPct;
  const spacing = centroids.length / Math.max(1, nSyllables);
  const ci = Math.min(centroids.length - 1, Math.floor(si * spacing));
  return pitchPct(centroids[ci], band, range);
}
