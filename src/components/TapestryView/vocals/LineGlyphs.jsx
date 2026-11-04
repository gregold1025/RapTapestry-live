// src/components/Tapestry/Vocals/LineGlyphs.jsx
import React, { useState } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useLineSelection } from "../../../contexts/lyricsContexts/LineSelectionContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useAudioControls } from "../../../contexts/AudioContext";
import { laneY } from "../../../utils/laneLayout";

const LINE_SHADOW_FILTER_ID = "tapestry-line-shadow";

export default function LineGlyphs({ transcriptionData }) {
  const HOVER_STROKE = "#00ff3b"; // solid green

  const { layout, laneFor } = useTapestryLayout();
  const { getVisualForLine, anchorOrAdopt, selections, removeSelection } = useLineSelection();
  const {
    showLines, lineInactiveColor, lineInactiveOpacity, lineOpacity, lineBand, lineShadow, showEndRhymes,
  } = useParams();
  const { seekAll } = useAudioControls();

  const [hoveredLineIdx, setHoveredLineIdx] = useState(null);
  if (!layout || !showLines) return null;

  const { rowHeight, width, timeToPixels } = layout;
  const lane = laneFor("vocals");
  const shadowOn = lineShadow > 0;

  function removeMostRecentAnchorFor(lineIdx) {
    const candidates = selections.filter((s) => s.lineIdx === lineIdx);
    if (!candidates.length) return;
    const mostRecent = candidates.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    removeSelection(mostRecent.id);
  }

  const rects = transcriptionData.lines.flatMap((line, lineIdx) => {
    if (typeof line.start !== "number" || typeof line.end !== "number") return [];

    const vis = getVisualForLine(lineIdx);
    const isHovered = hoveredLineIdx === lineIdx;

    // Gate match coloring on showEndRhymes (anchors always show)
    const effectiveVis = vis && (vis.role === "anchor" || showEndRhymes) ? vis : null;
    const active = !!effectiveVis;

    const fill = active ? effectiveVis.color : lineInactiveColor;
    const opacity = active ? lineOpacity : lineInactiveOpacity;
    const stroke = isHovered ? HOVER_STROKE : effectiveVis?.role === "anchor" ? effectiveVis.color : "none";
    const strokeWidth = isHovered ? 4 : effectiveVis?.role === "anchor" ? 3 : 0;

    const out = [];
    const { x: startX, row: startRow } = timeToPixels(line.start);
    const { x: endX, row: endRow } = timeToPixels(line.end);

    for (let row = startRow; row <= endRow; row++) {
      const x1 = row === startRow ? startX : 0;
      const x2 = row === endRow ? endX : width;
      const segWidth = Math.max(1, x2 - x1);
      const rowTop = row * rowHeight;
      const yTop = laneY(rowTop, rowHeight, lane, lineBand.hi);
      const yBot = laneY(rowTop, rowHeight, lane, lineBand.lo);

      out.push(
        <rect
          key={`line-${lineIdx}-r${row}`}
          x={x1}
          y={yTop}
          width={segWidth}
          height={Math.max(1, yBot - yTop)}
          fill={fill}
          opacity={opacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
          filter={shadowOn && active ? `url(#${LINE_SHADOW_FILTER_ID})` : undefined}
          style={{ cursor: "pointer" }}
          pointerEvents="visiblePainted"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey) { e.stopPropagation(); anchorOrAdopt(lineIdx); return; }
            if (e.altKey) { e.stopPropagation(); removeMostRecentAnchorFor(lineIdx); return; }
            seekAll(line.start);
          }}
          onMouseEnter={() => setHoveredLineIdx(lineIdx)}
          onMouseLeave={() => setHoveredLineIdx(null)}
          title={"Click: seek • Cmd/Ctrl+Click: adopt/create anchor • Alt+Click: remove anchor"}
        />
      );
    }
    return out;
  });

  return (
    <>
      {shadowOn && (
        <defs>
          <filter id={LINE_SHADOW_FILTER_ID} x="-10%" y="-40%" width="120%" height="180%">
            <feDropShadow dx="0" dy={2 + lineShadow * 4} stdDeviation={lineShadow * 6} floodColor="#000" floodOpacity={0.25 + lineShadow * 0.5} />
          </filter>
        </defs>
      )}
      {rects}
    </>
  );
}
