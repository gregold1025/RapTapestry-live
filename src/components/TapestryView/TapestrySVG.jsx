// src/components/TapestryView/TapestrySVG.jsx
import React from "react";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import SyllableGlyphs from "./SyllableGlyphs";
import WordGlyphs from "./WordGlyphs";
import "./TapestryView.css";

export default function TapestrySVG({
  transcriptionData,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  if (!layout) return <div>Loading layout…</div>;

  const { numberOfRows, rowHeight, width, secondsPerRow } = layout;
  const timeToX = (t) => ((t % secondsPerRow) / secondsPerRow) * width;

  return (
    <svg
      viewBox={`0 0 ${width} ${rowHeight * numberOfRows}`}
      preserveAspectRatio="none"
    >
      <WordGlyphs
        transcriptionData={transcriptionData}
        timeToX={timeToX}
        onGlyphHoverEnter={onGlyphHoverEnter}
        onGlyphHoverLeave={onGlyphHoverLeave}
      />
      <SyllableGlyphs
        transcriptionData={transcriptionData}
        timeToX={timeToX}
        onGlyphHoverEnter={onGlyphHoverEnter}
        onGlyphHoverLeave={onGlyphHoverLeave}
      />
    </svg>
  );
}
