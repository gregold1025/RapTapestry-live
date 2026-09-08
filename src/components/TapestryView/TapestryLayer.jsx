// src/components/TapestryView/TapestryLayer.jsx
import React from "react";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";

/**
 * One stacked <svg> of the tapestry. Every layer shares the same viewBox and
 * box, so glyph coordinates are identical to the old single-SVG render, but
 * each layer is its own compositor layer (see .tapestry-layer in CSS): a
 * change in one layer (e.g. word-selection fills) no longer repaints the
 * others (e.g. the thousands of masked syllable glyphs).
 *
 * The root has pointer-events: none so empty regions fall through to lower
 * layers; interactive glyphs opt back in with pointerEvents="visiblePainted".
 */
export default function TapestryLayer({ name, children }) {
  const { layout } = useTapestryLayout();
  if (!layout) return null;
  const { numberOfRows, rowHeight, width } = layout;
  return (
    <svg
      className="tapestry-layer"
      data-layer={name}
      viewBox={`0 0 ${width} ${rowHeight * numberOfRows}`}
      preserveAspectRatio="none"
    >
      {children}
    </svg>
  );
}
