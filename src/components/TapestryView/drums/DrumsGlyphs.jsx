import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useParams } from "../../../contexts/ParamsContext";
import { hitYOffset, velocityToOpacity } from "../../../utils/drumUtils";

// Inline SVG shape per drum category, centered at (0,0)
function DrumGlyph({ category, size, color, opacity }) {
  const r = size * 0.4;
  const style = { stroke: color, fill: "none", strokeWidth: 2, opacity };

  switch (category) {
    case "kick":
      return (
        <rect
          x={-r}
          y={-r * 0.4}
          width={r * 2}
          height={r * 0.8}
          fill={color}
          opacity={opacity}
          stroke="none"
        />
      );
    case "snare":
      return (
        <g opacity={opacity}>
          <circle cx={0} cy={0} r={r} style={{ ...style, opacity: 1 }} />
          <circle cx={0} cy={0} r={r * 0.3} fill={color} stroke="none" />
        </g>
      );
    case "hihat_closed":
      return (
        <g style={style}>
          <line x1={-r} y1={-r} x2={r} y2={r} />
          <line x1={r} y1={-r} x2={-r} y2={r} />
        </g>
      );
    case "hihat_open":
      return (
        <g style={style}>
          <line x1={-r} y1={r * 0.5} x2={0} y2={-r * 0.5} />
          <line x1={0} y1={-r * 0.5} x2={r} y2={r * 0.5} />
        </g>
      );
    case "tom":
      return (
        <polygon
          points={`0,${-r} ${r},0 0,${r} ${-r},0`}
          fill={color}
          opacity={opacity}
          stroke="none"
        />
      );
    case "crash":
      return (
        <g style={style}>
          <line x1={-r} y1={0} x2={r} y2={0} />
          <line x1={-r * 0.5} y1={-r * 0.866} x2={r * 0.5} y2={r * 0.866} />
          <line x1={r * 0.5} y1={-r * 0.866} x2={-r * 0.5} y2={r * 0.866} />
        </g>
      );
    case "ride":
      return (
        <circle cx={0} cy={0} r={r} style={style} />
      );
    default:
      // legacy high/mid/low + unknown → vertical tick
      return (
        <line x1={0} y1={-r * 0.5} x2={0} y2={r * 0.5} style={style} />
      );
  }
}

export default function DrumsGlyphs({ drumTranscriptionData }) {
  const { layout } = useTapestryLayout();
  const { showDrums, showDrumGlyphs, drumParams, drumCategoryColors } = useParams();

  if (!layout || !drumTranscriptionData || !showDrums || !showDrumGlyphs)
    return null;

  const { rowHeight, timeToPixels } = layout;
  const { drum_hits } = drumTranscriptionData;

  const hits = useMemo(() => {
    if (!Array.isArray(drum_hits)) return [];
    return drum_hits
      .filter((h) => h && Number.isFinite(h.time))
      .sort((a, b) => a.time - b.time);
  }, [drum_hits]);

  const { tilt = -80, opacity = 0.5, size = 36 } = drumParams || {};

  return hits.map((hit, idx) => {
    const { x, y } = timeToPixels(hit.time);
    const cy = y + hitYOffset(hit.category, rowHeight);
    const color = drumCategoryColors?.[hit.category] ?? "#dddddd";
    const hitOpacity = velocityToOpacity(hit.velocity, opacity);

    return (
      <g
        key={`drumglyph-${idx}`}
        transform={`translate(${x}, ${cy}) rotate(${tilt})`}
        pointerEvents="none"
      >
        <DrumGlyph
          category={hit.category}
          size={size}
          color={color}
          opacity={hitOpacity}
        />
      </g>
    );
  });
}
