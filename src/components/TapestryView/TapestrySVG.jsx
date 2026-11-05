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
import LoopGlyphs from "./global/LoopGlyphs";
import StaffVocals from "./staff/StaffVocals";
import { useUIState } from "../../contexts/UIStateContext";
import TapestryLayer from "./TapestryLayer";
import "./TapestryView.css";

export default function TapestrySVG({
  variant = "tapestry",
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { staffMode } = useUIState();
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
      {/* the Line Staff is words and drums (the prototype's pocket view); no bass there */}
      {variant !== "staff" && (
        <TapestryLayer name="bass">
          <BassGlyphs />
        </TapestryLayer>
      )}
      {variant === "staff" ? (
        <TapestryLayer name="staff-vocals">
          <StaffVocals mode={staffMode} onGlyphHoverEnter={onGlyphHoverEnter} onGlyphHoverLeave={onGlyphHoverLeave} />
        </TapestryLayer>
      ) : (
        <VocalsGlyphs
          lyricTranscriptionData={lyricTranscription}
          onGlyphHoverEnter={onGlyphHoverEnter}
          onGlyphHoverLeave={onGlyphHoverLeave}
        />
      )}
      <TapestryLayer name="drums">
        <DrumsGlyphs />
        <DrumGrid drumTranscriptionData={drumTranscription} variant={variant} />
        <HorizontalGrid />
      </TapestryLayer>
      <TapestryLayer name="loop">
        <LoopGlyphs />
      </TapestryLayer>
    </>
  );
}
