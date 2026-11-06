// src/components/ClockPane/clockMarks.js
// What the clock draws for each word (and, below, each drum hit), as plain
// data: arcs per ring, the query visual (color, line style by form), and a
// dot at the middle of each vowel of the rhyme (syllables vi0..vi1). Pitch
// plays no part.
import { wordSegments } from "./clockGeometry";

/** Line style by rhyme form, as in the Line Staff. */
export const FORM_DASH = Object.freeze({ word: null, mosaic: "7 4", embedded: "1.5 4", semirhyme: "0.5 3" });

/**
 * @returns {{ id, text, color, dash, hit, form, segments: {ring, f0, f1}[], dots: {ring, frac}[], start }[]}
 */
export function wordMarks({ timingWords, visuals, cycles, W, rings, words, inkColor, texts }) {
  const out = [];
  if (!timingWords || !cycles || cycles.count === 0) return out;
  const inView = (cycle) => cycle - W >= 0 && cycle - W < rings;
  for (const [id, tw] of timingWords) {
    const vis = visuals?.get(id) ?? null;
    if (words === "query" && !vis) continue;
    const segments = wordSegments(tw.start, tw.end, cycles)
      .filter((s) => inView(s.cycle))
      .map((s) => ({ ring: s.cycle - W, f0: s.f0, f1: s.f1 }));
    if (!segments.length) continue;
    const dots = [];
    if (vis) {
      for (const sy of tw.syls ?? []) {
        if (sy.k < (vis.vi0 ?? 0) || sy.k > (vis.vi1 ?? Infinity)) continue;
        const t = ((sy.vStart ?? sy.start) + (sy.vEnd ?? sy.end)) / 2;
        const c = cycles.cycleOf(t);
        if (c >= 0 && inView(c)) dots.push({ ring: c - W, frac: cycles.fracOf(t) });
      }
    }
    out.push({
      id, text: texts?.get(id) ?? "", color: vis ? vis.color : inkColor, dash: vis ? FORM_DASH[vis.form] ?? null : null,
      hit: !!vis, form: vis?.form ?? null, segments, dots, start: tw.start,
    });
  }
  return out;
}

/**
 * One cycle of drum hits, grouped as the drum layer groups them (classes, or
 * bands when the song has no classifier output). Unnamed onsets ("other")
 * keep their frequency band as a small height nudge, as in DrumsGlyphs.
 * @returns {{ frac, rowKey, height, time, conf }[]}
 */
export function drumMarks({ hits, cycles, cycle, groups, byClass }) {
  const out = [];
  if (!hits || !cycles || cycles.count === 0 || cycle == null || cycle < 0) return out;
  for (const hit of hits) {
    if (cycles.cycleOf(hit.time) !== cycle) continue;
    const key = byClass ? hit.cls : hit.category;
    const rowKey = groups?.[key] ? key : byClass ? "other" : "low";
    const g = groups?.[rowKey];
    if (!g || g.visible === false) continue;
    const bandOffset = rowKey === "other" ? ({ low: -4, mid: 0, high: 4 }[hit.category] ?? 0) : 0;
    out.push({ frac: cycles.fracOf(hit.time), rowKey, height: Math.max(0, Math.min(100, (g.height ?? 50) + bandOffset)), time: hit.time, conf: hit.conf ?? null });
  }
  return out;
}
