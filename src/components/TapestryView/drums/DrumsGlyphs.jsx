import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useParams } from "../../../contexts/ParamsContext";
import { laneY } from "../../../utils/laneLayout";

// One shared <mask> + <symbol> pair serves every drum glyph; each hit is a
// single <use>. The symbol is a 3x "safe area" box with the glyph in the
// centre third, matching the previous per-hit mask geometry.
const DRUM_MASK_ID = "tapestry-drum-glyph-mask";
const DRUM_SYMBOL_ID = "tapestry-drum-glyph";
const DRUM_NOMINAL = 300; // symbol viewBox size (glyph occupies 100..200)

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function DrumsGlyphs({ drumTranscriptionData }) {
  const { layout, laneFor } = useTapestryLayout();
  const { showDrums, showDrumGlyphs, drumParams, drumBands, glyphStyle } = useParams();

  const glyphUrl = glyphStyle?.drumGlyphUrl ?? null;

  const drum_hits = drumTranscriptionData?.drum_hits;
  const hits = useMemo(() => {
    if (!Array.isArray(drum_hits)) return [];
    return drum_hits
      .filter((h) => h && Number.isFinite(h.time))
      .sort((a, b) => a.time - b.time);
  }, [drum_hits]);

  // Hooks above; early return below (rules-of-hooks).
  if (!layout || !drumTranscriptionData || !showDrums || !showDrumGlyphs) return null;

  const { rowHeight, timeToPixels } = layout;
  const lane = laneFor("drums");
  const { fillColor = "#bbbbbb", tilt = 10 } = drumParams || {};
  const tiltDeg = clamp(tilt, -90, 90);

  const glyphs = [];
  for (let idx = 0; idx < hits.length; idx++) {
    const hit = hits[idx];
    const band = drumBands?.[hit.category] ?? drumBands?.low;
    if (!band || band.visible === false) continue;
    const size = band.size ?? 12;
    const maskBox = size * 3; // generous safe area around the rotated glyph
    const { x, y } = timeToPixels(hit.time);
    const cy = laneY(y, rowHeight, lane, band.height ?? 50);

    glyphs.push(
      <use
        key={`drumglyph-${idx}`}
        href={`#${DRUM_SYMBOL_ID}`}
        transform={`translate(${x}, ${cy}) rotate(${tiltDeg})`}
        x={-maskBox / 2}
        y={-maskBox / 2}
        width={maskBox}
        height={maskBox}
        fill={fillColor}
        opacity={band.opacity ?? 1}
        pointerEvents="none"
      />
    );
  }

  return (
    <>
      {glyphUrl && (
        <defs>
          <mask
            id={DRUM_MASK_ID}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x={0} y={0} width={DRUM_NOMINAL} height={DRUM_NOMINAL}
          >
            <image
              href={glyphUrl}
              x={DRUM_NOMINAL / 3} y={DRUM_NOMINAL / 3}
              width={DRUM_NOMINAL / 3} height={DRUM_NOMINAL / 3}
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </mask>
          <symbol id={DRUM_SYMBOL_ID} viewBox={`0 0 ${DRUM_NOMINAL} ${DRUM_NOMINAL}`}>
            <rect x={0} y={0} width={DRUM_NOMINAL} height={DRUM_NOMINAL} mask={`url(#${DRUM_MASK_ID})`} />
          </symbol>
        </defs>
      )}
      {glyphs}
    </>
  );
}
