// src/components/TapestryView/global/scrollTarget.js
// In the scroll layout a click on the BACKGROUND plays from there. Glyphs
// (rect / path / circle / use, which carry their own click handlers) and the
// Freeze / Follow toolbar are not background.
const GLYPH_TAGS = new Set(["rect", "path", "circle", "use", "ellipse", "line", "polygon", "text", "image"]);

export function isBackgroundTarget(el) {
  if (!el) return false;
  if (el.closest?.(".scroll-toolbar")) return false;
  const tag = String(el.tagName || "").toLowerCase();
  if (GLYPH_TAGS.has(tag)) return false;
  return true;
}
