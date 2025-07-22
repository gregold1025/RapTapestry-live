import React from "react";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import SyllableGlyphs from "./SyllableGlyphs";

export default function TapestrySVG({ transcriptionData }) {
  const { layout, containerRef } = useTapestryLayout();

  if (!layout) return <div ref={containerRef}>Loading layout...</div>;

  const {
    numberOfRows,
    rowHeight,
    width,
    secondsPerRow,
    secondsPerBar,
    barsPerRow,
  } = layout;

  const timeToX = (t) => {
    return (t % secondsPerRow) * (width / secondsPerRow);
  };

  const debugRects = Array.from({ length: numberOfRows }, (_, rowIdx) => {
    const y = rowIdx * rowHeight;
    const isEven = rowIdx % 2 === 0;
    const fill = isEven ? "#eeeeee" : "#cccccc";
    return (
      <g key={`row-${rowIdx}`}>
        <rect x={0} y={y} width={width} height={rowHeight} fill={fill} />
        <text x={10} y={y + 20} fontSize={14} fill="black">
          Row {rowIdx} (y={y.toFixed(1)})
        </text>
      </g>
    );
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 300,
        position: "relative",
        overflow: "visible",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${rowHeight * numberOfRows}`}
        style={{ display: "block" }}
      >
        {debugRects}
        <SyllableGlyphs
          transcriptionData={transcriptionData}
          timeToX={timeToX}
        />
      </svg>
    </div>
  );
}
