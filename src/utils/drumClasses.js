// src/utils/drumClasses.js
// The drum classifier (ADTOF Frame_RNN, experiments/drums-01) names the app's
// own onsets: "tandem" = the stem's onsets (drum-transcription.json, with their
// frequency band) named by the model's hits (drum-classes.json, from the summed
// stems) within a join window. A name counts when its peak clears the class's
// published threshold times a user multiplier k. An onset gets ONE MARK PER
// CLASS that clears it (snare and hi-hat played together on a backbeat are both
// drawn; Greg 2026-11-05); an onset with no name is one "other" mark.
export const DRUM_CLASSES = ["kick", "snare", "hihat", "tom", "cymbal", "other"];
export const DRUM_CLASS_LABELS = { kick: "Kick", snare: "Snare", hihat: "Hi-hat", tom: "Tom", cymbal: "Cymbal", other: "Unnamed" };
export const JOIN_MS = 30;

export function nameOnsets(onsets, named, thresholds, k = 1, joinMs = JOIN_MS) {
  const win = joinMs / 1000;
  const sorted = [...(named ?? [])].sort((a, b) => a.time - b.time);
  const ons = [...(onsets ?? [])].sort((a, b) => a.time - b.time);
  const out = [];
  let j = 0;
  for (const o of ons) {
    while (j < sorted.length && sorted[j].time < o.time - win) j++;
    const best = new Map(); // cls -> strongest named hit in the window
    for (let i = j; i < sorted.length && sorted[i].time <= o.time + win; i++) {
      const c = sorted[i];
      const thr = thresholds?.[c.cls];
      if (!thr || c.peak < thr * k) continue;
      const prev = best.get(c.cls);
      if (!prev || c.peak > prev.peak) best.set(c.cls, c);
    }
    if (!best.size) { out.push({ ...o, cls: "other", conf: null }); continue; }
    for (const cls of DRUM_CLASSES) {
      const c = best.get(cls);
      if (c) out.push({ ...o, cls, conf: c.conf });
    }
  }
  return out;
}
