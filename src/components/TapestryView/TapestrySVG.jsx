// src/components/TapestryView/TapestrySVG.jsx
import React, { useEffect } from "react";
import { perfMark, perfMarkAfterPaint } from "../../utils/perfMarks";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import { useSongData } from "../../contexts/SongDataContext";
import VocalsGlyphs from "./vocals/VocalsGlyphs";
import DrumsGlyphs from "./drums/DrumsGlyphs";
import BassGlyphs from "./bass/BassGlyphs";
import DrumGrid from "./drums/DrumGrid";
import HorizontalGrid from "./global/HorizontalGrid";
import TapestryLayer from "./TapestryLayer";
import "./TapestryView.css";

export default function TapestrySVG({
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { lyricTranscription, drumTranscription, bassTranscription } = useSongData();

  // Load-time KPI: when the full tapestry SVG first commits + first paints.
  const hasLayout = !!layout;
  useEffect(() => {
    if (!hasLayout) return;
    perfMark("tapestry-svg-committed");
    perfMarkAfterPaint("tapestry-svg-painted");
  }, [hasLayout]);

  if (!layout) return <div>Loading layout...</div>;

  // Stacked per-layer SVGs, same z-order as the old single SVG:
  // bass < lines < words < syllables < drums + grids.
  return (
    <>
      <TapestryLayer name="bass">
        <BassGlyphs bassTranscriptionData={bassTranscription} />
      </TapestryLayer>
      <VocalsGlyphs
        lyricTranscriptionData={lyricTranscription}
        onGlyphHoverEnter={onGlyphHoverEnter}
        onGlyphHoverLeave={onGlyphHoverLeave}
      />
      <TapestryLayer name="drums">
        <DrumsGlyphs drumTranscriptionData={drumTranscription} />
        <DrumGrid drumTranscriptionData={drumTranscription} />
        <HorizontalGrid />
      </TapestryLayer>
    </>
  );
}
