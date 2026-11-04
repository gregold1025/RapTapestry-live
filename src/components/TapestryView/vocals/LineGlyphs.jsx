// src/components/TapestryView/vocals/LineGlyphs.jsx
// Line queries are drawn here and only here: the anchor line and every line
// whose last word rhymes with its last word. Clicking a line makes (or moves)
// a line query; word queries never tint lines.
import React, { useState } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useQueries } from "../../../contexts/QueryContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useSongData } from "../../../contexts/SongDataContext";
import { laneY } from "../../../utils/laneLayout";

const LINE_SHADOW_FILTER_ID = "tapestry-line-shadow";
const HOVER_STROKE = "#00ff3b";

export default function LineGlyphs({ transcriptionData }) {
  const { layout, laneFor } = useTapestryLayout();
  const { visualByLineIdx, clickLine } = useQueries();
  const { timing } = useSongData();
  const { showLines, lineInactiveColor, lineInactiveOpacity, lineOpacity, lineBand, lineShadow } = useParams();
  const [hoveredLineIdx, setHoveredLineIdx] = useState(null);

  if (!layout || !showLines) return null;

  const { rowHeight, width, timeToPixels } = layout;
  const lane = laneFor("vocals");
  const shadowOn = lineShadow > 0;

  const rects = transcriptionData.lines.flatMap((line, lineIdx) => {
    const n = line.words?.length ?? 0;
    const t0 = timing?.words.get(`${lineIdx}-0`)?.start ?? line.start;
    const t1 = timing?.words.get(`${lineIdx}-${n - 1}`)?.end ?? line.end;
    if (typeof t0 !== "number" || typeof t1 !== "number") return [];

    const vis = visualByLineIdx.get(lineIdx);
    const isHovered = hoveredLineIdx === lineIdx;
    const active = !!vis;
    const fill = active ? vis.color : lineInactiveColor;
    const opacity = active ? (vis.role === "anchor" ? lineOpacity : lineOpacity * 0.6) : lineInactiveOpacity;
    const stroke = isHovered ? HOVER_STROKE : vis?.role === "anchor" ? vis.color : "none";
    const strokeWidth = isHovered ? 3 : vis?.role === "anchor" ? 2 : 0;

    const out = [];
    const { x: startX, row: startRow } = timeToPixels(t0);
    const { x: endX, row: endRow } = timeToPixels(t1);
    for (let row = startRow; row <= endRow; row++) {
      const x1 = row === startRow ? startX : 0;
      const x2 = row === endRow ? endX : width;
      const rowTop = row * rowHeight;
      const yTop = laneY(rowTop, rowHeight, lane, lineBand.hi);
      const yBot = laneY(rowTop, rowHeight, lane, lineBand.lo);
      out.push(
        <rect
          key={`line-${lineIdx}-r${row}`}
          x={x1} y={yTop} width={Math.max(1, x2 - x1)} height={Math.max(1, yBot - yTop)}
          fill={fill} fillOpacity={opacity}
          stroke={stroke} strokeOpacity={isHovered ? 1 : opacity} strokeWidth={strokeWidth}
          filter={shadowOn && active ? `url(#${LINE_SHADOW_FILTER_ID})` : undefined}
          style={{ cursor: "pointer" }}
          pointerEvents="visiblePainted"
          onClick={(e) => { e.stopPropagation(); clickLine(lineIdx, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey, alt: e.altKey }); }}
          onMouseEnter={() => setHoveredLineIdx(lineIdx)}
          onMouseLeave={() => setHoveredLineIdx(null)}
          title={"Click: line query (end rhyme) • Cmd+Click: new query • Alt+Click: remove"}
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
