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
import { layerOrder } from "./layerOrder";
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

  // Stacked per-layer SVGs, bottom to top (layerOrder): the grid first, so every glyph sits on
  // its lines (Greg 2026-11-10); the Line Staff reveals glyphs with the playhead but always shows
  // its grid (ScrollController leaves the grid and loop layers unclipped).
  const layers = {
    grid: (
      <TapestryLayer name="grid">
        <DrumGrid drumTranscriptionData={drumTranscription} variant={variant} />
        <HorizontalGrid />
      </TapestryLayer>
    ),
    bass: (
      <TapestryLayer name="bass">
        <BassGlyphs />
      </TapestryLayer>
    ),
    "staff-vocals": (
      <TapestryLayer name="staff-vocals">
        <StaffVocals mode={staffMode} onGlyphHoverEnter={onGlyphHoverEnter} onGlyphHoverLeave={onGlyphHoverLeave} />
      </TapestryLayer>
    ),
    vocals: (
      <VocalsGlyphs
        lyricTranscriptionData={lyricTranscription}
        onGlyphHoverEnter={onGlyphHoverEnter}
        onGlyphHoverLeave={onGlyphHoverLeave}
      />
    ),
    drums: (
      <TapestryLayer name="drums">
        <DrumsGlyphs />
      </TapestryLayer>
    ),
    loop: (
      <TapestryLayer name="loop">
        <LoopGlyphs />
      </TapestryLayer>
    ),
  };
  return <>{layerOrder(variant).map((k) => <React.Fragment key={k}>{layers[k]}</React.Fragment>)}</>;
}
