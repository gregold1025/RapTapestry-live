import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useAudioEngine } from "../../../contexts/AudioContext";
import { useParams } from "../../../contexts/ParamsContext";

/**
 * Visualizes bass notes from a JSON file with structure:
 * {
 *   start_time: number,
 *   end_time: number,
 *   pitch_class: number (0–11),
 *   mean_rms: number (optional)
 * }
 */
export default function BassGlyphs({ bassTranscriptionData }) {
  const { layout } = useTapestryLayout();
  const { playheadTime } = useAudioEngine();
  const { showBass, bassParams } = useParams();

  if (!layout || !bassTranscriptionData || !showBass) return null;

  const { rectHeight, fillColor, opacity, blur = 0 } = bassParams;
  const { rowHeight, secondsPerRow, timeToPixels, width } = layout;

  // unique filter id to avoid collisions if multiple instances render
  const filterId = useMemo(
    () => `bass-blur-${Math.random().toString(36).slice(2)}`,
    []
  );

  const tolerance = 0.08; // ~80ms visual playhead window

  const glyphs = useMemo(() => {
    return bassTranscriptionData.flatMap((note, idx) => {
      const { start_time, end_time, pitch_class } = note;
      const isActive =
        playheadTime >= start_time && playheadTime <= end_time + tolerance;

      const { x: startX, row: startRow } = timeToPixels(start_time);
      const { x: endX, row: endRow } = timeToPixels(end_time);

      const bins = 12;
      const pitchBin = Math.max(0, Math.min(bins - 1, pitch_class));
      const binHeight = (rowHeight * 0.5) / bins;
      const binOffset = binHeight * pitchBin;

      const baseY = (row) => row * rowHeight + rowHeight * 0.9 - binOffset;

      const rects = [];

      for (let row = startRow; row <= endRow; row++) {
        const x1 = row === startRow ? startX : 0;
        const x2 = row === endRow ? endX : width;
        const segWidth = Math.max(1, x2 - x1);
        const y = baseY(row);

        rects.push(
          <rect
            key={`bass-${idx}-r${row}`}
            x={x1}
            y={y}
            width={segWidth}
            height={rectHeight}
            // fill={isActive ? "#ffcc00" : fillColor}
            fill={fillColor}
            // opacity={isActive ? 1.0 : opacity}
            opacity={opacity}
          />
        );
      }

      return rects;
    });
  }, [
    bassTranscriptionData,
    layout,
    playheadTime,
    rectHeight,
    fillColor,
    opacity,
  ]);

  return (
    <>
      {/* Only inject the filter definition if blur > 0 */}
      {blur > 0 && (
        <defs pointerEvents="none">
          <filter
            id={filterId}
            // expand the filter region so the blur doesn't get clipped
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            filterUnits="objectBoundingBox"
            // stdDeviation is in user units (pixels)
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} />
          </filter>
        </defs>
      )}

      {/* Apply blur to all bass rects as a group if enabled */}
      {blur > 0 ? <g filter={`url(#${filterId})`}>{glyphs}</g> : <>{glyphs}</>}
    </>
  );
}
