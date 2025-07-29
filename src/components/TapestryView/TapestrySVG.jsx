// src/components/TapestryView/TapestrySVG.jsx
import React from "react";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import VocalsGlyphs from "./vocals/VocalsGlyphs";
import DrumsGlyphs from "./drums/DrumsGlyphs";
import DrumGrid from "./drums/DrumGrid";
import SVGPlayhead from "./global/SVGPlayhead";
import HorizontalGrid from "./global/HorizontalGrid";
import "./TapestryView.css";

export default function TapestrySVG({
  lyricTranscriptionData,
  drumTranscriptionData,
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
      <VocalsGlyphs
        lyricTranscriptionData={lyricTranscriptionData}
        onGlyphHoverEnter={onGlyphHoverEnter}
        onGlyphHoverLeave={onGlyphHoverLeave}
      />
      <DrumsGlyphs drumTranscriptionData={drumTranscriptionData}></DrumsGlyphs>{" "}
      <DrumGrid drumTranscriptionData={drumTranscriptionData} />
      <HorizontalGrid />
    </svg>
  );
}
