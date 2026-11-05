// src/utils/gridStroke.js
// Beat and bar line colors for a background. Each is the background pushed
// toward black or white (whichever contrasts more), as an opaque color, so the
// grid stays visible on mid tones where a faint black or white line vanishes.

/** "#rgb" / "#rrggbb" -> [r, g, b] 0..255; anything else -> white. */
function parse(hex) {
  let h = typeof hex === "string" ? hex.trim() : "";
  if (/^#[0-9a-f]{3}$/i.test(h)) h = "#" + [...h.slice(1)].map((c) => c + c).join("");
  if (!/^#[0-9a-f]{6}$/i.test(h)) h = "#ffffff";
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
}

const toHex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** WCAG relative luminance. */
function luminance(c) {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors (1..21). */
export function contrastRatio(a, b) {
  const la = luminance(parse(a)), lb = luminance(parse(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const BEAT_MIX = 0.3;
export const BAR_MIX = 0.4;

/** { beat, bar } line colors for `background`. */
export function gridStrokes(background) {
  const bg = parse(background);
  const l = luminance(bg);
  const pole = (1.05 / (l + 0.05)) > ((l + 0.05) / 0.05) ? 255 : 0;
  const mix = (a) => toHex(bg.map((v) => v + (pole - v) * a));
  return { beat: mix(BEAT_MIX), bar: mix(BAR_MIX) };
}
