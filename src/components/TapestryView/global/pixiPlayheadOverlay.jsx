// src/components/TapestryView/PixiPlayheadOverlay.jsx
import React, { useRef, useEffect, useCallback } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";

import { useAudioControls } from "../../../contexts/AudioContext";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import "../TapestryView.css";

extend({ Container, Graphics });

export function PlayheadLine() {
  const { subscribePlayhead, getPlayheadTime } = useAudioControls();
  const { layout } = useTapestryLayout();
  const graphicsRef = useRef(null);

  // Keep the latest layout in a ref so the subscription closure stays stable.
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const draw = useCallback((t) => {
    const lay = layoutRef.current;
    const g = graphicsRef.current;
    if (!lay || !g) return;
    const { rowHeight, timeToPixels } = lay;
    const { x: currentX, y: currentY } = timeToPixels(t);
    g.clear();
    g.setStrokeStyle({ width: 3, color: 0xff0000, alpha: 1 });
    g.moveTo(currentX, currentY);
    g.lineTo(currentX, currentY + rowHeight);
    g.stroke();
  }, []);

  // Per-frame imperative redraw (no React re-render).
  useEffect(() => subscribePlayhead(draw), [subscribePlayhead, draw]);

  // Redraw at the current playhead position when layout changes (resize / row reflow).
  useEffect(() => {
    draw(getPlayheadTime());
  }, [
    layout?.rowHeight,
    layout?.width,
    layout?.contentHeight,
    layout?.timeToPixels,
    draw,
    getPlayheadTime,
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
