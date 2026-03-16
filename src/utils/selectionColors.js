// src/utils/selectionColors.js
// Shared color utilities for selection contexts.
// Extracted from WordSelectionContext / LineSelectionContext / SyllableSelectionContext
// to eliminate 150+ lines of copy-paste duplication.

/**
 * Extract hue (0-360) from a hex or hsl() color string.
 * Returns null for achromatic or unrecognized formats.
 */
export function colorToHue(color) {
  if (!color) return null;
  const m = color.match(/hsl\(\s*(\d+)/);
  if (m) return parseInt(m[1]);
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return null;
    const d = max - min;
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return Math.round(h * 360);
  }
  return null;
}

/**
 * Convert HSL values to a hex color string.
 * Always returns a hex string (required by hexToRgba).
 */
export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

/**
 * Generate an HSL color visually distinct from all existing selection colors.
 * Tries random hues; falls back to the hue maximizing minimum angular distance.
 */
export function generateDistinctColor(existingColors) {
  const existingHues = existingColors.map(colorToHue).filter((h) => h !== null);
  const MIN_GAP = 35;
  const hueDistance = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

  for (let i = 0; i < 40; i++) {
    const hue = Math.floor(Math.random() * 360);
    if (existingHues.every((eh) => hueDistance(hue, eh) >= MIN_GAP)) {
      return hslToHex(hue, 78, 52);
    }
  }
  // Fallback: pick hue that maximizes minimum distance from existing
  let bestHue = 0, bestMin = -1;
  for (let h = 0; h < 360; h += 3) {
    const minD = existingHues.length === 0 ? 180
      : Math.min(...existingHues.map((eh) => hueDistance(h, eh)));
    if (minD > bestMin) { bestMin = minD; bestHue = h; }
  }
  return hslToHex(bestHue, 78, 52);
}
