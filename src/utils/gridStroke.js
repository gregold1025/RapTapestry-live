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

// On white, bars are the original 20% black (#cccccc) and beats #b3b3b3; on any
// background each is pushed further until it reaches a contrast of 1.5.
export const BAR_MIX = 0.2;
export const BEAT_MIX = 0.3;
export const MIN_CONTRAST = 1.5;
// Eighths and sixteenths stand off the background 40% as much as beats do.
export const SUB_SHARE = 0.4;

/** { beat, bar, sub } line colors for `background`. */
export function gridStrokes(background) {
  const bg = parse(background);
  const l = luminance(bg);
  const pole = (1.05 / (l + 0.05)) > ((l + 0.05) / 0.05) ? 255 : 0;
  const at = (a) => bg.map((v) => Math.round(v + (pole - v) * a));
  const ratio = (c) => { const lc = luminance(c); return (Math.max(l, lc) + 0.05) / (Math.min(l, lc) + 0.05); };
  // the smallest push (from `from`) that reaches `target`
  const reach = (target, from = 0) => {
    for (let a = from; a < 1; a += 0.005) if (ratio(at(a)) >= target) return a;
    return 1;
  };
  const beat = at(reach(MIN_CONTRAST, BEAT_MIX));
  const bar = at(reach(MIN_CONTRAST, BAR_MIX));
  const sub = at(reach(1 + (ratio(beat) - 1) * SUB_SHARE));
  return { beat: toHex(beat), bar: toHex(bar), sub: toHex(sub) };
}

/** `fill`, unless it would vanish on `background` (contrast under 2): then `fallback`. */
export function inkOn(fill, background, fallback) {
  return contrastRatio(fill, background) < 2 ? fallback : fill;
}
