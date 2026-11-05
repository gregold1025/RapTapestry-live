// src/utils/drumClasses.js
// The drum classifier (ADTOF Frame_RNN, experiments/drums-01) names the app's
// own onsets: "tandem" = the stem's onsets (drum-transcription.json, with their
// frequency band) named by the model's hits (drum-classes.json, from the summed
// stems) within a join window. A name counts when its peak clears the class's
// published threshold times a user multiplier k; an onset with no name is "other".
export const DRUM_CLASSES = ["kick", "snare", "hihat", "tom", "cymbal", "other"];
export const DRUM_CLASS_LABELS = { kick: "Kick", snare: "Snare", hihat: "Hi-hat", tom: "Tom", cymbal: "Cymbal", other: "Unnamed" };
export const JOIN_MS = 30;

export function nameOnsets(onsets, named, thresholds, k = 1, joinMs = JOIN_MS) {
  const win = joinMs / 1000;
  const sorted = [...(named ?? [])].sort((a, b) => a.time - b.time);
  let j = 0;
  return (onsets ?? []).map((o) => {
    while (j < sorted.length && sorted[j].time < o.time - win) j++;
    let best = null, bestR = 0;
    for (let i = j; i < sorted.length && sorted[i].time <= o.time + win; i++) {
      const c = sorted[i];
      const thr = thresholds?.[c.cls];
      if (!thr) continue;
      const r = c.peak / (thr * k);
      if (r >= 1 && r > bestR) { best = c; bestR = r; }
    }
    return { ...o, cls: best ? best.cls : "other", conf: best ? best.conf : null };
  });
}
