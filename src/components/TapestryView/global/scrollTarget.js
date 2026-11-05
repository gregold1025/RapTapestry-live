// src/components/TapestryView/global/scrollTarget.js
// A plain click on the BACKGROUND of a tapestry scrubs to that point. Glyphs
// carry their own click handlers (and stop propagation, which cannot reach a
// native listener that runs before React's): anything drawn, any text riding a
// curve, anything inside an interactive glyph group, the loop handles and the
// Freeze / Follow toolbar are not background.
const GLYPH_TAGS = new Set(["rect", "path", "circle", "use", "ellipse", "line", "polygon", "text", "tspan", "textpath", "image"]);

export function isBackgroundTarget(el) {
  if (!el) return false;
  if (el.closest?.(".scroll-toolbar") || el.closest?.("[data-loop-handle]")) return false;
  if (el.closest?.('[pointer-events="visiblePainted"]') || el.closest?.('[pointer-events="all"]')) return false;
  const tag = String(el.tagName || "").toLowerCase();
  if (GLYPH_TAGS.has(tag)) return false;
  return true;
}
