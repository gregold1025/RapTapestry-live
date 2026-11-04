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

/** Map a 0..1 centroid into a {lo, hi} percent band. */
export function pitchPct(c, band) {
  const v = clamp(Number.isFinite(c) ? c : 0.5, 0, 1);
  return band.lo + (band.hi - band.lo) * v;
}

/** Percent height for a word rectangle given its mode. */
export function wordPitchCenter(word, mode, band, center) {
  if (mode !== "pitched" && mode !== "perSyllable") return center;
  const c = Array.isArray(word?.centroid) ? word.centroid[0] : undefined;
  if (!Number.isFinite(c)) return center;
  return pitchPct(c, band);
}

/** Percent height for syllable `si` of `nSyllables` (same centroid sampling as before). */
export function syllablePitchPct(word, si, nSyllables, band, fallbackPct) {
  const centroids = Array.isArray(word?.centroid) ? word.centroid : [];
  if (!centroids.length) return fallbackPct;
  const spacing = centroids.length / Math.max(1, nSyllables);
  const ci = Math.min(centroids.length - 1, Math.floor(si * spacing));
  return pitchPct(centroids[ci], band);
}
