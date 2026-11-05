// src/components/TapestryView/TapestryView.jsx
import React, { useRef } from "react";
import TapestrySVG from "./TapestrySVG";
import PixiPlayheadOverlay from "./global/pixiPlayheadOverlay";
import ScrollController from "./global/ScrollController";
import { useCanvasHoverInfo } from "./hooks/useCanvasHoverInfo";
import { CanvasHoverTooltip } from "./global/CanvasHoverToolTip";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import { useParams } from "../../contexts/ParamsContext";
import { useAudioControls } from "../../contexts/AudioContext";
import { isBackgroundTarget } from "./global/scrollTarget";
import "./TapestryView.css";

export default function TapestryView({ variant = "tapestry" }) {
  const { containerRef, layout } = useTapestryLayout();
  const { seekAll } = useAudioControls();
  const contentRef = useRef(null);
  const { hoverInfo, onHoverEnter, onHoverMove, onHoverLeave } =
    useCanvasHoverInfo();

  const contentHeight = layout?.contentHeight ?? 0;
  const scroll = !!layout?.singleRow;

  const { tapestryBackgroundColor } = useParams();

  return (
    <div
      className={`tapestry-container ${scroll ? "is-scroll" : ""}`}
      ref={containerRef}
      onMouseMove={onHoverMove}
      onMouseLeave={onHoverLeave}
      style={{ backgroundColor: tapestryBackgroundColor }}
    >
      {/* Wrap: this wrapper enables fixed-row-height vertical scrolling.
          Scroll: it is as wide as the song and translated by ScrollController. */}
      <div
        ref={contentRef}
        className="tapestry-content"
        style={scroll
          ? { width: `${layout.width}px`, height: "100%" }
          : { height: contentHeight ? `${contentHeight}px` : "100%" }}
        onClick={scroll ? undefined : (e) => {
          // wrap: a plain click on the background scrubs to that point
          if (!layout || !isBackgroundTarget(e.target)) return;
          const r = e.currentTarget.getBoundingClientRect();
          seekAll(layout.pointToTime(e.clientX - r.left, e.clientY - r.top));
        }}
      >
        <TapestrySVG
          variant={variant}
          onGlyphHoverEnter={onHoverEnter}
          onGlyphHoverLeave={onHoverLeave}
        />
        {!scroll && <PixiPlayheadOverlay />}
      </div>
      {scroll && <ScrollController containerRef={containerRef} contentRef={contentRef} />}
      <CanvasHoverTooltip hoverInfo={hoverInfo} />
    </div>
  );
}
