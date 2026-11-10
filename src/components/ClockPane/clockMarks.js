// src/components/ClockPane/clockMarks.js
// What the clock draws for each word (and, below, each drum hit), as plain
// data: arcs per ring, the query visual (color, line style by form), and a
// dot at the middle of each vowel of the rhyme (syllables vi0..vi1). Pitch
// plays no part.
import { wordSegments } from "./clockGeometry";
import { endUnits } from "../../engine/lineRhymes";
import { sylRange } from "../../utils/phoneMarks";

/** Line style by rhyme form, as in the Line Staff. */
export const FORM_DASH = Object.freeze({ word: null, mosaic: "7 4", embedded: "1.5 4", semirhyme: "0.5 3" });

/**
 * Marks are placed by song position u = cycle + frac; only the cycles in
 * [from, to) are kept.
 * @returns {{ id, text, color, dash, hit, form, segments: {u0, u1}[], dots: {u}[], start }[]}
 */
export function wordMarks({ timingWords, visuals, cycles, from, to, words, inkColor, texts }) {
  const out = [];
  if (!timingWords || !cycles || cycles.count === 0) return out;
  const inView = (cycle) => cycle >= from && cycle < to;
  for (const [id, tw] of timingWords) {
    const vis = visuals?.get(id) ?? null;
    if (words === "query" && !vis) continue;
    const segments = wordSegments(tw.start, tw.end, cycles)
      .filter((s) => inView(s.cycle))
      .map((s) => ({ u0: s.cycle + s.f0, u1: s.cycle + s.f1 }));
    if (!segments.length) continue;
    const dots = [];
    if (vis) {
      for (const sy of tw.syls ?? []) {
        if (sy.k < (vis.vi0 ?? 0) || sy.k > (vis.vi1 ?? Infinity)) continue;
        const t = ((sy.vStart ?? sy.start) + (sy.vEnd ?? sy.end)) / 2;
        const c = cycles.cycleOf(t);
        if (c >= 0 && inView(c)) dots.push({ u: c + cycles.fracOf(t) });
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
 * Query syllables against the groove (Greg 2026-11-10): every matched syllable (vi0..vi1) of a
 * query word or a match whose vowel begins in `cycle`, as a tick in the drum ring at its vowel's
 * onset (where a syllable lands), in its query's color.
 * @returns {{ frac, color }[]}
 */
export function syllableTicks({ timingWords, visuals, cycles, cycle }) {
  const out = [];
  if (!timingWords || !visuals?.size || !cycles || cycles.count === 0 || cycle == null || cycle < 0) return out;
  for (const [id, vis] of visuals) {
    const tw = timingWords.get(id);
    if (!tw) continue;
    for (const sy of tw.syls ?? []) {
      if (sy.k < (vis.vi0 ?? 0) || sy.k > (vis.vi1 ?? Infinity)) continue;
      const t = sy.vStart ?? sy.start;
      if (cycles.cycleOf(t) === cycle) out.push({ frac: cycles.fracOf(t), color: vis.color });
    }
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

/**
 * Line queries on the clock (none are made here; the clock shows them): every
 * queried or matched line (visualByLineIdx) takes its query's color, and only
 * the line's rhyming end comes up as words: the query line's last three words
 * (the extent of a line query), a matched line's matched words, with the
 * match's form and rhyme vowels.
 * @returns {{ lines: {li, color}[], words: Map<string, {queryId, color, type, form, vi0, vi1, isAnchor}> }}
 */
export function lineMarks({ visualByLineIdx, matchesByQueryId, songModel }) {
  const lines = [], words = new Map();
  if (!visualByLineIdx) return { lines, words };
  for (const [li, v] of [...visualByLineIdx].sort((a, b) => a[0] - b[0])) {
    lines.push({ li, color: v.color });
    if (v.isAnchor) {
      for (const id of endUnits(songModel, li).at(-1) ?? []) {
        words.set(id, { queryId: v.queryId, color: v.color, type: "anchor", form: null, vi0: 0, vi1: Infinity, isAnchor: true });
      }
      continue;
    }
    const lm = (matchesByQueryId?.get(v.queryId) ?? []).find((x) => x.lineIdx === li);
    for (const w of lm?.words ?? []) {
      const { vi0, vi1 } = sylRange(lm.match ?? lm, w);
      words.set(w.id, { queryId: v.queryId, color: v.color, type: lm.type, form: lm.form, vi0, vi1, isAnchor: false });
    }
  }
  return { lines, words };
}

/**
 * Where each line lies on the spiral: song positions (cycle + frac) from its
 * first word's start to its last word's end (the spiral is continuous, so one
 * stretch), clipped to the cycles in [from, to). The intro is dropped.
 * @returns {{ li, color, start, u0, u1 }[]}
 */
export function lineSpans({ lines, timingWords, songModel, cycles, from, to }) {
  const out = [];
  if (!lines?.length || !timingWords || !cycles || cycles.count === 0) return out;
  const u = (t) => {
    const tt = Math.max(t, cycles.start(0));
    return cycles.cycleOf(tt) + cycles.fracOf(tt);
  };
  for (const { li, color } of lines) {
    const n = songModel?.lines?.[li]?.words?.length ?? 0;
    const first = timingWords.get(`${li}-0`), last = timingWords.get(`${li}-${n - 1}`);
    if (!n || !first || !last) continue;
    const u0 = Math.max(from, u(first.start)), u1 = Math.min(to, u(last.end));
    if (!(u1 > u0)) continue;
    out.push({ li, color, start: first.start, u0, u1 });
  }
  return out;
}
