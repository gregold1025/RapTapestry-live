import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";

export default function DrumGrid({
  drumTranscriptionData,
  strokeColor = "#000",
}) {
  const { layout } = useTapestryLayout();
  if (!layout || !drumTranscriptionData) return null;

  const { rowHeight, width, secondsPerRow, numberOfRows } = layout;
  const { beats, downbeats } = drumTranscriptionData;

  // Helper: convert time → X and row index
  const timeToX = (t) => ((t % secondsPerRow) / secondsPerRow) * width;
  const timeToRow = (t) => Math.floor(t / secondsPerRow);

  const lines = [];

  // Draw downbeats
  downbeats.forEach((t, i) => {
    const row = timeToRow(t);
    const x = timeToX(t);
    const y1 = row * rowHeight;
    const y2 = y1 + rowHeight;
    lines.push(
      <line
        key={`downbeat-${i}`}
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={3}
        opacity={0.8}
      />
    );
  });

  // Draw normal beats
  beats.forEach((t, i) => {
    const row = timeToRow(t);
    const x = timeToX(t);
    const y1 = row * rowHeight;
    const y2 = y1 + rowHeight;
    lines.push(
      <line
        key={`beat-${i}`}
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={1}
        opacity={0.5}
      />
    );
  });

  return <g className="drum-grid">{lines}</g>;
}
