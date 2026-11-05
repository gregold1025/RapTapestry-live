// src/utils/timingModel.js
// Per-word timing and pitch for the tapestry, from the MFA measured dataset
// (experiments/mfa-02-formants, copied to public/data/<Song>/lyric-transcription.measured.json):
// aligned word times, measured syllable onsets, and F0 per vowel. Words the
// aligner did not place, or songs without the file, fall back to the Audioshake
// times with an even syllable split and no pitch. Matching never reads this.

import { syllabify, bare } from "./syllabify.js";
import { spellSyllables } from "./spellSyllables.js";

function median(sorted) {
  if (!sorted.length) return null;
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Each syllable also carries, for the Line Staff: vStart/vEnd (the vowel's
 * own span), cluster (its phones, lower-case, from the aligner's phone
 * intervals via syllabify), vIdx (the vowel's index in the cluster), chunk
 * (its share of the spelling, via spellSyllables; null when the spelling will
 * not align), pass2 (quiet vowel, second-pass pitch), estimated (even split).
 * @returns {{ words: Map<string, { start, end, aligned, phones, syls: [{ k, start, end, f0, vowel, stress, vStart, vEnd, cluster, vIdx, chunk }], f0 }>, f0Mid: number|null, aligned: number }}
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
      const phonesStr = m ? m.pron : ((Array.isArray(w.phones) ? w.phones[0] : w.phones) ?? "");
      const timed = m?.phones?.length ? m.phones : null;
      const clusters = syllabify(timed ?? String(phonesStr).trim().split(/\s+/).filter(Boolean).map((p) => ({ p })));
      const vowelsOk = clusters.every((c) => c.v >= 0);
      if (m && timed && vowelsOk && Array.isArray(m.syllables) && m.syllables.length === clusters.length) {
        // aligned: syllables as phone clusters with the aligner's times
        aligned++;
        syls = clusters.map((c, k) => {
          const vw = c.phones[c.v], ms = mw.measured?.[k] ?? {};
          const f0 = Number.isFinite(ms.f0) ? ms.f0 : null;
          return { k, start: c.phones[0].start, end: c.phones[c.phones.length - 1].end, vStart: vw.start, vEnd: vw.end,
            f0, vowel: bare(vw.p), stress: +(String(vw.p).match(/\d/)?.[0] ?? 0),
            cluster: c.phones.map((x) => bare(x.p).toLowerCase()), vIdx: c.v, pass2: ms.f0_pass === 2, measured: !!ms && !ms.unmeasured };
        });
      } else if (m && Array.isArray(m.syllables) && m.syllables.length) {
        aligned++;
        syls = m.syllables.map((s, k) => {
          const ms = mw.measured?.[k] ?? {};
          const next = m.syllables[k + 1]?.onset ?? end;
          const f0 = Number.isFinite(ms.f0) ? ms.f0 : null;
          const vowel = ms.vowel ?? String(s.vowel ?? "").replace(/\d/g, "");
          return { k, start: s.onset, end: next, vStart: ms.start ?? s.onset, vEnd: ms.end ?? next, f0, vowel, stress: ms.stress ?? +(String(s.vowel ?? "").match(/\d/)?.[0] ?? 0), cluster: [vowel.toLowerCase()], vIdx: 0, pass2: ms.f0_pass === 2 };
        });
      } else {
        const n = Math.max(1, w.nSyllables ?? 1);
        const d = (end - start) / n;
        const cl = vowelsOk && clusters.length === n ? clusters : null;
        syls = Array.from({ length: n }, (_, k) => ({ k, start: start + k * d, end: start + (k + 1) * d, vStart: start + k * d, vEnd: start + (k + 1) * d, f0: null,
          vowel: cl ? bare(cl[k].phones[cl[k].v].p) : "", stress: cl ? +(String(cl[k].phones[cl[k].v].p).match(/\d/)?.[0] ?? 0) : 0,
          cluster: cl ? cl[k].phones.map((x) => bare(x.p).toLowerCase()) : null, vIdx: cl ? cl[k].v : 0, estimated: true }));
      }
      // the spelling cut into one chunk per syllable (null when it will not align)
      const text = String(w.text ?? "").replace(/\n/g, "").trim();
      const chunks = syls.every((sy) => sy.cluster) ? spellSyllables(text, syls.map((sy) => sy.cluster.join(" ").toUpperCase())) : [text];
      for (let k = 0; k < syls.length; k++) syls[k].chunk = chunks.length === syls.length ? chunks[k] : null;
      const f0s = syls.map((s) => s.f0).filter((f) => f != null).sort((a, b) => a - b);
      for (const f of f0s) allF0.push(f);
      words.set(id, { start, end, aligned: !!m, phones: String(phonesStr), syls, f0: median(f0s) });
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
