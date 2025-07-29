// src/components/TapestryView/TapestryView.jsx
import React from "react";
import TapestrySVG from "./TapestrySVG";
import PixiPlayheadOverlay from "./global/pixiPlayheadOverlay";
import { useCanvasHoverInfo } from "./hooks/useCanvasHoverInfo";
import { CanvasHoverTooltip } from "./global/CanvasHoverToolTip";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import "./TapestryView.css";

export default function TapestryView({
  lyricTranscription,
  drumTranscription,
}) {
  const { containerRef } = useTapestryLayout();
  const { hoverInfo, onHoverEnter, onHoverMove, onHoverLeave } =
    useCanvasHoverInfo();

  return (
    <div
      className="tapestry-container"
      ref={containerRef}
      onMouseMove={onHoverMove}
      onMouseLeave={onHoverLeave}
    >
      <TapestrySVG
        lyricTranscriptionData={lyricTranscription}
        drumTranscriptionData={drumTranscription}
        onGlyphHoverEnter={onHoverEnter}
        onGlyphHoverLeave={onHoverLeave}
      />
      <PixiPlayheadOverlay />
      <CanvasHoverTooltip hoverInfo={hoverInfo} />
    </div>
  );
}
