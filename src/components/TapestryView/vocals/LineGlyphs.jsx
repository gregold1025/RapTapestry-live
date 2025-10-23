// src/components/Tapestry/Vocals/LineGlyphs.jsx
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
  const { getVisualForLine, anchorOrAdopt, selections, removeSelection } =
    useLineSelection();
  const { showLines, lineInactiveColor, lineOpacity } = useParams();
  const { seekAll } = useAudioEngine();

  const [hoveredLineIdx, setHoveredLineIdx] = useState(null);
  if (!layout || !showLines) return null;

  const { rowHeight, width, timeToPixels } = layout;

  function removeMostRecentAnchorFor(lineIdx) {
    const candidates = selections.filter((s) => s.lineIdx === lineIdx);
    if (!candidates.length) return;
    const mostRecent = candidates.reduce((a, b) =>
      a.createdAt > b.createdAt ? a : b
    );
    removeSelection(mostRecent.id);
  }

  return transcriptionData.lines.flatMap((line, lineIdx) => {
    if (typeof line.start !== "number" || typeof line.end !== "number")
      return [];

    const vis = getVisualForLine(lineIdx);
    const isHovered = hoveredLineIdx === lineIdx;

    const fill = vis ? vis.color : lineInactiveColor;
    const stroke =
      vis?.role === "anchor" ? vis.color : isHovered ? fill : "none";
    const strokeWidth = vis?.role === "anchor" ? 6 : isHovered ? 3 : 0;

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
          onClick={(e) => {
            // Cmd/Ctrl + Click => adopt-or-create (collision-aware)
            if (e.metaKey || e.ctrlKey) {
              e.stopPropagation();
              anchorOrAdopt(lineIdx);
              return;
            }
            // Alt + Click => remove most recent anchor for this line
            if (e.altKey) {
              e.stopPropagation();
              removeMostRecentAnchorFor(lineIdx);
              return;
            }
            // Default: seek
            seekAll(line.start);
          }}
          onMouseEnter={(e) => {
            setHoveredLineIdx(lineIdx);
            onGlyphHoverEnter?.(e, {
              type: "line",
              lineIdx,
              text: line.text,
              start: line.start,
              end: line.end,
            });
          }}
          onMouseLeave={(e) => {
            setHoveredLineIdx(null);
            onGlyphHoverLeave?.(e);
          }}
          title={
            "Click: seek • Cmd/Ctrl+Click: adopt/create anchor • Alt+Click: remove anchor"
          }
        />
      );
    }
    return rects;
  });
}
