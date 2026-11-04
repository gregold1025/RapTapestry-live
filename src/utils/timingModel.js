// src/utils/timingModel.js
// Per-word timing and pitch for the tapestry, from the MFA measured dataset
// (experiments/mfa-02-formants, copied to public/data/<Song>/lyric-transcription.measured.json):
// aligned word times, measured syllable onsets, and F0 per vowel. Words the
// aligner did not place, or songs without the file, fall back to the Audioshake
// times with an even syllable split and no pitch. Matching never reads this.

function median(sorted) {
  if (!sorted.length) return null;
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * @returns {{ words: Map<string, { start, end, aligned, syls: [{ k, start, end, f0, vowel, stress }], f0 }>, f0Mid: number|null, aligned: number }}
 */
export function buildTiming(lyricTranscription, measured) {
  const words = new Map();
  const allF0 = [];
  let aligned = 0;
  const lines = lyricTranscription?.lines ?? [];
  lines.forEach((line, li) => {
    (line.words ?? []).forEach((w, wi) => {
      const id = `${li}-${wi}`;
      const mw = measured?.lines?.[li]?.words?.[wi];
      const m = mw?.mfa?.status === "aligned" ? mw.mfa : null;
      const start = m ? m.start : w.start;
      const end = m ? m.end : w.end;
      let syls;
      if (m && Array.isArray(m.syllables) && m.syllables.length) {
        aligned++;
        syls = m.syllables.map((s, k) => {
          const ms = mw.measured?.[k] ?? {};
          const next = m.syllables[k + 1]?.onset ?? end;
          const f0 = Number.isFinite(ms.f0) ? ms.f0 : null;
          return { k, start: s.onset, end: next, f0, vowel: ms.vowel ?? String(s.vowel ?? "").replace(/\d/g, ""), stress: ms.stress ?? +(String(s.vowel ?? "").match(/\d/)?.[0] ?? 0) };
        });
      } else {
        const n = Math.max(1, w.nSyllables ?? 1);
        const d = (end - start) / n;
        syls = Array.from({ length: n }, (_, k) => ({ k, start: start + k * d, end: start + (k + 1) * d, f0: null, vowel: "", stress: 0 }));
      }
      const f0s = syls.map((s) => s.f0).filter((f) => f != null).sort((a, b) => a - b);
      for (const f of f0s) allF0.push(f);
      words.set(id, { start, end, aligned: !!m, syls, f0: median(f0s) });
    });
  });
  allF0.sort((a, b) => a - b);
  return { words, f0Mid: median(allF0), aligned };
}

/** Semitones of f0 above the song's median, clamped to [-6, 18] like the Line Staff. */
export function f0Semitones(f0, f0Mid) {
  if (!f0 || !f0Mid) return null;
  return Math.max(-6, Math.min(18, 12 * Math.log2(f0 / f0Mid)));
}

/** Map an F0 into a percent band: -6 semitones -> band.lo, +18 -> band.hi; null -> fallback. */
export function f0Pct(f0, f0Mid, band, fallback) {
  const st = f0Semitones(f0, f0Mid);
  if (st == null) return fallback;
  return band.lo + ((st + 6) / 24) * (band.hi - band.lo);
}
