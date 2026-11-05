// src/components/TapestryView/drums/DrumGrid.jsx
import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useParams } from "../../../contexts/ParamsContext";
import { gridStrokes } from "../../../utils/gridStroke";
import { gridLines } from "../../../utils/gridLines";

const WIDTH = { bar: 3, beat: 1, sub: 0.6 };

/**
 * The vertical grid at the chosen level (none / bars / + beats / + eighths and
 * sixteenths). The Line Staff passes variant="staff" and uses its own level and
 * background. Downbeats are derived by counting beats: the first beat is bar 1.
 */
export default function DrumGrid({ drumTranscriptionData, variant = "tapestry" }) {
  const { layout } = useTapestryLayout();
  const p = useParams();
  const staff = variant === "staff";
  const level = staff ? p.staffGridLevel : p.gridLevel;
  const background = staff ? p.staffBackgroundColor : p.tapestryBackgroundColor;

  if (!layout || !drumTranscriptionData || !level) return null;

  // Opaque colors pushed off the background, so the grid reads on any background.
  const strokes = gridStrokes(background);
  const { rowHeight, timeToPixels, gridTimes, beatsPerBar } = layout;
  const ts = Number(drumTranscriptionData.time_signature_beats);
  const per = Number.isFinite(beatsPerBar) && beatsPerBar > 0 ? beatsPerBar : ts > 0 ? ts : 4;
  const beats = Array.isArray(gridTimes) && gridTimes.length ? gridTimes : drumTranscriptionData.beats ?? [];

  return (
    <g className="drum-grid">
      {gridLines(beats, per, level).map(({ t, kind }, i) => {
        const { x, y } = timeToPixels(t);
        return (
          <line
            key={i}
            className={`grid-${kind}`}
            x1={x} y1={y + 0.5} x2={x} y2={y + rowHeight - 0.5}
            stroke={kind === "bar" ? strokes.bar : strokes.beat}
            strokeWidth={WIDTH[kind]}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </g>
  );
}
