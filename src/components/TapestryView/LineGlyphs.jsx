// src/components/TapestryView/LineGlyphs.jsx
import React from "react";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import { useLineSelection } from "../../contexts/LineSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import { useAudioEngine } from "../../contexts/AudioContext";

export default function LineGlyphs({
  transcriptionData,
  timeToX,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { selectedLineIdx } = useLineSelection();
  const { showLines, lineActiveColor, lineInactiveColor, lineOpacity } =
    useParams();
  const { seekAll } = useAudioEngine();

  if (!layout || !timeToX || !showLines) return null;

  const { secondsPerRow, rowHeight, width } = layout;

  return transcriptionData.lines.flatMap((line, lineIdx) => {
    if (typeof line.start !== "number" || typeof line.end !== "number")
      return [];

    const startRow = Math.floor(line.start / secondsPerRow);
    const endRow = Math.floor(line.end / secondsPerRow);
    const isSelected = selectedLineIdx === lineIdx;

    const fill = isSelected ? lineActiveColor : lineInactiveColor;
    const stroke = isSelected ? "#00aa00" : "none";

    const rects = [];
    for (let row = startRow; row <= endRow; row++) {
      const x1 = row === startRow ? timeToX(line.start) : 0;
      const x2 = row === endRow ? timeToX(line.end) : width;
      const segWidth = Math.max(1, x2 - x1);

      rects.push(
        <rect
          key={`line-${lineIdx}-r${row}`}
          x={x1}
          y={row * rowHeight}
          width={segWidth}
          height={rowHeight}
          fill={fill}
          opacity={lineOpacity}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 0}
          style={{ cursor: "pointer" }}
          onClick={() => seekAll(line.start)}
          onMouseEnter={(e) =>
            onGlyphHoverEnter?.(e, {
              type: "line",
              lineIdx,
              text: line.text.trim(),
              start: line.start,
              end: line.end,
            })
          }
          onMouseLeave={onGlyphHoverLeave}
        />
      );
    }

    return rects;
  });
}
