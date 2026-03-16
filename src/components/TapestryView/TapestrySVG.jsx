// src/components/TapestryView/TapestrySVG.jsx
import React from "react";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import { useSongData } from "../../contexts/SongDataContext";
import VocalsGlyphs from "./vocals/VocalsGlyphs";
import DrumsGlyphs from "./drums/DrumsGlyphs";
import BassGlyphs from "./bass/BassGlyphs";
import DrumGrid from "./drums/DrumGrid";
import HorizontalGrid from "./global/HorizontalGrid";
import "./TapestryView.css";

export default function TapestrySVG({
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { lyricTranscription, drumTranscription, bassTranscription } = useSongData();
  if (!layout) return <div>Loading layout...</div>;

  const { numberOfRows, rowHeight, width } = layout;

  return (
    <svg
      viewBox={`0 0 ${width} ${rowHeight * numberOfRows}`}
      preserveAspectRatio="none"
    >
      <BassGlyphs bassTranscriptionData={bassTranscription} />
      <VocalsGlyphs
        lyricTranscriptionData={lyricTranscription}
        onGlyphHoverEnter={onGlyphHoverEnter}
        onGlyphHoverLeave={onGlyphHoverLeave}
      />
      <DrumsGlyphs drumTranscriptionData={drumTranscription} />
      <DrumGrid drumTranscriptionData={drumTranscription} />

      <HorizontalGrid />
    </svg>
  );
}
