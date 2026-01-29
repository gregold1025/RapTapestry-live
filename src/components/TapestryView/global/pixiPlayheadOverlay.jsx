// src/components/TapestryView/PixiPlayheadOverlay.jsx
import React, { useRef, useEffect } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";

import { useAudioEngine } from "../../../contexts/AudioContext";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import "../TapestryView.css";

extend({ Container, Graphics });

export function PlayheadLine() {
  const { playheadTime } = useAudioEngine();
  const { layout } = useTapestryLayout();
  const graphicsRef = useRef(null);

  useEffect(() => {
    if (!layout || !graphicsRef.current) return;

    const g = graphicsRef.current;
    const { rowHeight, timeToPixels } = layout;

    // Map playheadTime to current grid coordinates with latest layout
    const { x: currentX, y: currentY } = timeToPixels(playheadTime);

    g.clear();
    g.setStrokeStyle({ width: 3, color: 0xff0000, alpha: 1 });
    g.moveTo(currentX, currentY);
    g.lineTo(currentX, currentY + rowHeight);
    g.stroke();
  }, [
    playheadTime,
    layout?.rowHeight,
    layout?.width,
    layout?.contentHeight, // <-- key: redraw when scrollable height changes
    layout?.timeToPixels, // function identity changes when layout recomputes
  ]);

  return <pixiGraphics ref={graphicsRef} />;
}

export default function PixiPlayheadOverlay() {
  const { layout } = useTapestryLayout();
  if (!layout) return null;

  const width = layout.width;

  // IMPORTANT:
  // layout.height = viewport/container height
  // layout.contentHeight = total scrollable content height (rowHeight * numberOfRows)
  const height = layout.contentHeight ?? layout.height;

  return (
    <div
      className="canvas-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 10,
      }}
    >
      <Application
        // Force a clean Pixi remount whenever drawable size changes
        key={`${width}x${height}`}
        width={width}
        height={height}
        backgroundAlpha={0}
        autoDensity={true}
        antialias={true}
        resolution={Math.min(window.devicePixelRatio || 1, 2)}
      >
        <pixiContainer>
          <PlayheadLine />
        </pixiContainer>
      </Application>
    </div>
  );
}
