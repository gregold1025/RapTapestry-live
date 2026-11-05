// src/utils/gridLines.js
// The tapestry's vertical grid at one of four levels:
//   0 none · 1 bar lines · 2 bar + beat lines · 3 bar + beat + eighth and sixteenth lines.
// Every position gets one line only (a beat line is never drawn on a bar line),
// so lines never stack into two tones.

export const GRID_LEVELS = ["none", "bars", "bars + beats", "+ 8ths & 16ths"];

/** beats: beat times (the first beat is a downbeat) -> [{ t, kind: "bar" | "beat" | "sub" }] in time order. */
export function gridLines(beats, beatsPerBar = 4, level = 2) {
  if (!level || !Array.isArray(beats) || !beats.length) return [];
  const per = beatsPerBar > 0 ? beatsPerBar : 4;
  const out = [];
  for (let i = 0; i < beats.length; i++) {
    const t = beats[i];
    const isBar = i % per === 0;
    if (isBar) out.push({ t, kind: "bar" });
    else if (level >= 2) out.push({ t, kind: "beat" });
    if (level >= 3 && i + 1 < beats.length) {
      const dt = (beats[i + 1] - t) / 4;
      for (let k = 1; k < 4; k++) out.push({ t: t + k * dt, kind: "sub" });
    }
  }
  return out;
}
