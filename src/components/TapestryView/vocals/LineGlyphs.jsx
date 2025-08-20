import React, { useState } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useLineSelection } from "../../../contexts/lyricsContexts/LineSelectionContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useAudioEngine } from "../../../contexts/AudioContext";

export default function LineGlyphs({
  transcriptionData,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { selectedLineIdx } = useLineSelection();
  const { showLines, lineActiveColor, lineInactiveColor, lineOpacity } =
    useParams();
  const { seekAll } = useAudioEngine();

  // Track hover
  const [hoveredLineIdx, setHoveredLineIdx] = useState(null);

  if (!layout || !showLines) return null;

  const { rowHeight, width, timeToPixels } = layout;

  return transcriptionData.lines.flatMap((line, lineIdx) => {
    if (typeof line.start !== "number" || typeof line.end !== "number")
      return [];

    const isSelected = selectedLineIdx === lineIdx;
    const isHovered = hoveredLineIdx === lineIdx;

    const fill = isSelected ? lineActiveColor : lineInactiveColor;
    const stroke = isHovered ? lineActiveColor : "none";
    const strokeWidth = isHovered ? 2 : isSelected ? 2 : 0;

    const rects = [];
    const { x: startX, row: startRow } = timeToPixels(line.start);
    const { x: endX, row: endRow } = timeToPixels(line.end);

    for (let row = startRow; row <= endRow; row++) {
      const x1 = row === startRow ? startX : 0;
      const x2 = row === endRow ? endX : width;
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
          strokeWidth={strokeWidth}
          style={{ cursor: "pointer" }}
          onClick={() => seekAll(line.start)}
          onMouseEnter={(e) => {
            setHoveredLineIdx(lineIdx);
            // onGlyphHoverEnter?.(e, {
            //   type: "line",
            //   lineIdx,
            //   text: line.text,
            //   start: line.start,
            //   end: line.end,
            // });
          }}
          onMouseLeave={(e) => {
            setHoveredLineIdx(null);
            onGlyphHoverLeave?.(e);
          }}
        />
      );
    }

    return rects;
  });
}
