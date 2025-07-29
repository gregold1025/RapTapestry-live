// src/components/TapestryView/SVGPlayhead.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useAudioEngine } from "../../../contexts/AudioContext";

export default function SVGPlayhead({ onSeek }) {
  const { layout } = useTapestryLayout();
  const { playheadTime } = useAudioEngine();
  const [x, setX] = useState(0);
  const [rowY, setRowY] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    if (!layout) return;
    const { downbeats, timeToPixels, rowHeight } = layout;

    // Find current segment
    let segIndex = 0;
    for (let i = 0; i < downbeats.length - 1; i++) {
      if (playheadTime >= downbeats[i] && playheadTime < downbeats[i + 1]) {
        segIndex = i;
        break;
      }
    }

    const { x: startX, y: startY } = timeToPixels(downbeats[segIndex]);
    const { x: targetX } = timeToPixels(
      downbeats[segIndex + 1] || downbeats[segIndex]
    );
    const segmentDuration =
      (downbeats[segIndex + 1] || downbeats[segIndex]) - downbeats[segIndex];

    // If scrubbed (large jump), set directly
    if (Math.abs(x - startX) > layout.width * 0.2) {
      setX(startX);
      setRowY(startY);
      return;
    }

    // Animate
    let startTime = performance.now();
    cancelAnimationFrame(animRef.current);

    const animate = (now) => {
      const elapsed = (now - startTime) / 1000; // seconds
      const progress = Math.min(elapsed / segmentDuration, 1);
      const newX = startX + (targetX - startX) * progress;
      setX(newX);
      setRowY(startY);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [playheadTime, layout]);

  if (!layout) return null;

  return (
    <line
      x1={x}
      y1={rowY}
      x2={x}
      y2={rowY + layout.rowHeight}
      stroke="red"
      strokeWidth={3}
    />
  );
}
