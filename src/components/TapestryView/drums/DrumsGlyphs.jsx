import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useAudioEngine } from "../../../contexts/AudioContext";
import { useParams } from "../../../contexts/ParamsContext";

// --------------------------------------
// LOAD ALL SVG DRUM LINE GLYPH URLS
// --------------------------------------
const lineGlyphModules = import.meta.glob("/src/svg_lines/*.svg", {
  eager: true,
  import: "default",
});
const DRUM_GLYPH_URLS = Object.values(lineGlyphModules);

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
  const { playheadTime } = useAudioEngine();
  const { showDrums, showDrumGlyphs, drumParams, glyphStyle } = useParams();

  const glyphUrl = glyphStyle?.drumGlyphUrl ?? null;

  if (!layout || !drumTranscriptionData || !showDrums || !showDrumGlyphs)
    return null;

  const { rowHeight, timeToPixels } = layout;
  const { drum_hits } = drumTranscriptionData;

  const hits = useMemo(() => {
    if (!Array.isArray(drum_hits)) return [];
    return drum_hits
      .filter((h) => h && Number.isFinite(h.time))
      .sort((a, b) => a.time - b.time);
  }, [drum_hits]);

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
  const glyphs = hits.map((hit, idx) => {
    const { x, y } = timeToPixels(hit.time);

    const glyphSize = size;
    const cx = x;
    const cy = y + hitYOffset(hit.category, rowHeight) + glyphSize / 2;

    const maskId = `drum-mask-${idx}`;
    const maskBox = glyphSize * 3; // generous safe area
    const glyphBox = glyphSize; // actual glyph drawn inside

    return (
      <g
        key={`drumglyph-${idx}`}
        transform={`translate(${cx}, ${cy}) rotate(${tiltDeg})`}
        pointerEvents="none"
      >
        <g transform={`translate(${-maskBox / 2}, ${-maskBox / 2})`}>
          <defs>
            <mask id={maskId}>
              <rect x={0} y={0} width={maskBox} height={maskBox} fill="black" />
              <image
                href={glyphUrl}
                x={(maskBox - glyphBox) / 2}
                y={(maskBox - glyphBox) / 2}
                width={glyphBox}
                height={glyphBox}
                preserveAspectRatio="xMidYMid meet"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </mask>
          </defs>

          <rect
            x={0}
            y={0}
            width={maskBox}
            height={maskBox}
            fill={fillColor}
            opacity={opacity}
            mask={`url(#${maskId})`}
          />
        </g>
      </g>
    );
  });

  return <>{glyphs}</>;
}
