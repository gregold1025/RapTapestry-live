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

    // Map playheadTime to locked grid coordinates
    const { x: currentX, y: currentY } = timeToPixels(playheadTime);

    g.clear();
    g.setStrokeStyle({ width: 10, color: 0xff0000, alpha: 1 });
    g.moveTo(currentX, currentY);
    g.lineTo(currentX, currentY + rowHeight);
    g.stroke();
  }, [playheadTime, layout]);

  return <pixiGraphics ref={graphicsRef} />;
}

export default function PixiPlayheadOverlay() {
  const { layout } = useTapestryLayout();
  if (!layout) return null;

  const { width, height } = layout;

  return (
    <div
      className="canvas-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        width,
        height,
        zIndex: 10,
      }}
    >
      <Application
        width={width}
        height={height}
        backgroundAlpha={0}
        autoDensity={true}
        antialias={true}
        resolution={window.devicePixelRatio}
      >
        <pixiContainer>
          <PlayheadLine />
        </pixiContainer>
      </Application>
    </div>
  );
}
