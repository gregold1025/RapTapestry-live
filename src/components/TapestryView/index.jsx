// src/components/TapestryView/TapestryView.jsx
import React from "react";
import TapestrySVG from "./TapestrySVG";
import PixiPlayheadOverlay from "./global/pixiPlayheadOverlay";
import { useCanvasHoverInfo } from "./hooks/useCanvasHoverInfo";
import { CanvasHoverTooltip } from "./global/CanvasHoverToolTip";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import { useParams } from "../../contexts/ParamsContext";
import "./TapestryView.css";

export default function TapestryView({
  lyricTranscription,
  drumTranscription,
  bassTranscription,
}) {
  const { containerRef, layout } = useTapestryLayout();
  const { hoverInfo, onHoverEnter, onHoverMove, onHoverLeave } =
    useCanvasHoverInfo();

  const contentHeight = layout?.contentHeight ?? 0;

  const { tapestryBackgroundColor } = useParams();

  return (
    <div
      className="tapestry-container"
      ref={containerRef}
      onMouseMove={onHoverMove}
      onMouseLeave={onHoverLeave}
      style={{ backgroundColor: tapestryBackgroundColor }}
    >
      {/* This wrapper is what enables fixed-row-height vertical scrolling */}
      <div
        className="tapestry-content"
        style={{ height: contentHeight ? `${contentHeight}px` : "100%" }}
      >
        <TapestrySVG
          lyricTranscriptionData={lyricTranscription}
          drumTranscriptionData={drumTranscription}
          bassTranscriptionData={bassTranscription}
          onGlyphHoverEnter={onHoverEnter}
          onGlyphHoverLeave={onHoverLeave}
        />
        <PixiPlayheadOverlay />
        <CanvasHoverTooltip hoverInfo={hoverInfo} />
      </div>
    </div>
  );
}
