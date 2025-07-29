// src/components/TapestryView/drums/DrumGrid.jsx
import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";

export default function DrumGrid({
  drumTranscriptionData,
  strokeColor = "#000",
}) {
  const { layout } = useTapestryLayout();
  if (!layout || !drumTranscriptionData) return null;

  const { rowHeight, timeToPixels } = layout;
  const { beats, downbeats } = drumTranscriptionData;

  const lines = [];

  // Draw downbeats (full height)
  downbeats.forEach((t, i) => {
    const { x, y } = timeToPixels(t);
    lines.push(
      <line
        key={`downbeat-${i}`}
        x1={x}
        y1={y}
        x2={x}
        y2={y + rowHeight}
        stroke={strokeColor}
        strokeWidth={3}
        opacity={0.8}
      />
    );
  });

  // Draw normal beats (full height)
  beats.forEach((t, i) => {
    const { x, y } = timeToPixels(t);
    lines.push(
      <line
        key={`beat-${i}`}
        x1={x}
        y1={y}
        x2={x}
        y2={y + rowHeight}
        stroke={strokeColor}
        strokeWidth={1}
        opacity={0.5}
      />
    );
  });

  return <g className="drum-grid">{lines}</g>;
}
