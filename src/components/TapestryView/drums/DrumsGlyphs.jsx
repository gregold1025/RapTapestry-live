import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useParams } from "../../../contexts/ParamsContext";

// --------------------------------------
// LOAD ALL SVG DRUM LINE GLYPH URLS
// --------------------------------------
const lineGlyphModules = import.meta.glob("/src/svg_lines/*.svg", {
  eager: true,
  import: "default",
});
const DRUM_GLYPH_URLS = Object.values(lineGlyphModules);

// One shared <mask> + <symbol> pair serves every drum glyph; each hit is a
// single <use>. The symbol is a 3x "safe area" box with the glyph in the
// centre third, matching the previous per-hit mask geometry.
const DRUM_MASK_ID = "tapestry-drum-glyph-mask";
const DRUM_SYMBOL_ID = "tapestry-drum-glyph";
const DRUM_NOMINAL = 300; // symbol viewBox size (glyph occupies 100..200)
// category → vertical placement
function hitYOffset(category, rowHeight) {
  switch (category) {
    case "high":
      return rowHeight * 0.3;
    case "mid":
      return rowHeight * 0.425;
    case "low":
    default:
      return rowHeight * 0.55;
  }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function DrumsGlyphs({ drumTranscriptionData }) {
  const { layout } = useTapestryLayout();
  const { showDrums, showDrumGlyphs, drumParams, glyphStyle } = useParams();

  const glyphUrl = glyphStyle?.drumGlyphUrl ?? null;

  const drum_hits = drumTranscriptionData?.drum_hits;
  const hits = useMemo(() => {
    if (!Array.isArray(drum_hits)) return [];
    return drum_hits
      .filter((h) => h && Number.isFinite(h.time))
      .sort((a, b) => a.time - b.time);
  }, [drum_hits]);

  // Hooks above; early return below (rules-of-hooks).
  if (!layout || !drumTranscriptionData || !showDrums || !showDrumGlyphs)
    return null;

  const { rowHeight, timeToPixels } = layout;

  const {
    fillColor = "#bbbbbb",
    tilt = 10,
    opacity = 0.8,
    size = 36, // visual size of the glyph
  } = drumParams || {};

  const tiltDeg = clamp(tilt, -90, 90);

  // -------------------------------
  // RENDER GLYPHS
  // -------------------------------
  const maskBox = size * 3; // generous safe area around the rotated glyph
  const glyphs = hits.map((hit, idx) => {
    const { x, y } = timeToPixels(hit.time);

    const glyphSize = size;
    const cx = x;
    const cy = y + hitYOffset(hit.category, rowHeight) + glyphSize / 2;

    return (
      <use
        key={`drumglyph-${idx}`}
        href={`#${DRUM_SYMBOL_ID}`}
        transform={`translate(${cx}, ${cy}) rotate(${tiltDeg})`}
        x={-maskBox / 2}
        y={-maskBox / 2}
        width={maskBox}
        height={maskBox}
        fill={fillColor}
        opacity={opacity}
        pointerEvents="none"
      />
    );
  });

  return (
    <>
      {glyphUrl && (
        <defs>
          <mask
            id={DRUM_MASK_ID}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={DRUM_NOMINAL}
            height={DRUM_NOMINAL}
          >
            <image
              href={glyphUrl}
              x={DRUM_NOMINAL / 3}
              y={DRUM_NOMINAL / 3}
              width={DRUM_NOMINAL / 3}
              height={DRUM_NOMINAL / 3}
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </mask>
          <symbol id={DRUM_SYMBOL_ID} viewBox={`0 0 ${DRUM_NOMINAL} ${DRUM_NOMINAL}`}>
            <rect
              x={0}
              y={0}
              width={DRUM_NOMINAL}
              height={DRUM_NOMINAL}
              mask={`url(#${DRUM_MASK_ID})`}
            />
          </symbol>
        </defs>
      )}
      {glyphs}
    </>
  );
}
