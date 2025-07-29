import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";

export default function HorizontalGrid({ strokeColor = "#666" }) {
  const { layout } = useTapestryLayout();
  if (!layout) return null;

  const { numberOfRows, rowHeight, width } = layout;

  const lines = [];
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

  return <g className="horizontal-grid">{lines}</g>;
}
