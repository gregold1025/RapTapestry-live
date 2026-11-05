// src/utils/drumGlyphDefaults.js
// Drum rows pick from the syllable glyph set, one glyph per row (two rows never
// share one). Greg's defaults (2026-11-05): kick / low = square, snare / mid =
// triangle, hi-hat / high = forward slash, tom = pentagon, cymbal = squiggle,
// unnamed = none (a small circle).
const DEFAULTS = {
  kick: /shape-4-sided-square/, low: /shape-4-sided-square/,
  snare: /shape-3-sided-triangle/, mid: /shape-3-sided-triangle/,
  hihat: /line-slash-forward/, high: /line-slash-forward/,
  tom: /shape-5-sided-pentagon/,
  cymbal: /line-squiggle-long/,
};

/** byName: { "shape-4-sided-square": url, ... } (file names; the urls themselves may be data: URIs). */
export function defaultGlyphFor(key, byName) {
  const re = DEFAULTS[key];
  if (!re || !byName) return null;
  const name = Object.keys(byName).find((n) => re.test(n));
  return name ? byName[name] : null;
}

/** A random glyph no other row holds; null when every glyph is taken. */
export function pickUnused(urls, taken) {
  const free = urls.filter((u) => !taken.has(u));
  if (!free.length) return null;
  return free[Math.floor(Math.random() * free.length)];
}
