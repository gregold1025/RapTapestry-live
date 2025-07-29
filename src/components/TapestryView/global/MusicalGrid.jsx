// src/components/TapestryView/MusicalGrid.jsx
import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";

export default function MusicalGrid({
  beatsPerMeasure = 4,
  strokeColor = "#666",
}) {
  const { layout } = useTapestryLayout();
  if (!layout) return null;

  const {
    numberOfRows,
    rowHeight,
    width,
    secondsPerRow,
    barsPerRow, // ← this is your measures-per-row
  } = layout;

  const secondsPerMeasure = secondsPerRow / barsPerRow;
  const secondsPerBeat = secondsPerMeasure / beatsPerMeasure;

  const lines = [];

  // horizontal separators between rows
  for (let row = 1; row < numberOfRows; row++) {
    const y = row * rowHeight;
    lines.push(
      <line
        key={`h-${row}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke={strokeColor}
        strokeWidth={1}
      />
    );
  }

  // vertical lines for each beat (thicker on downbeats)
  for (let row = 0; row < numberOfRows; row++) {
    const y1 = row * rowHeight;
    const y2 = y1 + rowHeight;

    for (let bar = 0; bar < barsPerRow; bar++) {
      for (let beat = 0; beat < beatsPerMeasure; beat++) {
        const t = bar * secondsPerMeasure + beat * secondsPerBeat;
        const x = (t / secondsPerRow) * width;

        lines.push(
          <line
            key={`v-${row}-${bar}-${beat}`}
            x1={x}
            y1={y1}
            x2={x}
            y2={y2}
            stroke={strokeColor}
            strokeWidth={beat === 0 ? 3 : 1}
          />
        );
      }
    }
  }

  return <g className="musical-grid">{lines}</g>;
}
