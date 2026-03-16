import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
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

// --------------------------------------
// LOAD ALL SVG DIVIDER GLYPH URLS
// --------------------------------------
const dividerModules = import.meta.glob("/src/svg_dividers/*.svg", {
  eager: true,
  import: "default",
});
const BASS_DIVIDER_URLS = Object.values(dividerModules);

export default function BassGlyphs({ bassTranscriptionData }) {
  const { layout } = useTapestryLayout();
  const { showBass, bassParams, glyphStyle } = useParams();

  const dividerUrl = glyphStyle?.bassDividerUrl ?? null;

  if (!layout || !bassTranscriptionData || !showBass) return null;

  const { rowHeight, timeToPixels, width } = layout;
  const {
    rectHeight, // now used as GAP between rect and topper
    fillColor,
    opacity,
    blur = 0,
  } = bassParams;

  // unique filter id to avoid collisions if multiple instances render
  const filterId = useMemo(
    () => `bass-blur-${Math.random().toString(36).slice(2)}`,
    []
  );

  // Compute geometry once (does NOT depend on playheadTime)
  const noteGeometry = useMemo(() => {
    return bassTranscriptionData.map((note, idx) => {
      const { start_time, end_time, pitch_class } = note;

      const { x: startX, row: startRow } = timeToPixels(start_time);
      const { x: endX, row: endRow } = timeToPixels(end_time);

      const bins = 12;
      const pitchBin = Math.max(0, Math.min(bins - 1, pitch_class));
      const binHeight = (rowHeight * 0.5) / bins;
      const binOffset = binHeight * pitchBin;

      const baseY = (row) => row * rowHeight + rowHeight * 0.9 - binOffset;

      const segments = [];
      for (let row = startRow; row <= endRow; row++) {
        const x1 = row === startRow ? startX : 0;
        const x2 = row === endRow ? endX : width;
        const segWidth = Math.max(1, x2 - x1);
        const yTop = baseY(row);
        const rowBottom = (row + 1) * rowHeight;
        let segHeight = Math.max(1, rowBottom - yTop);
        const rectY = rowBottom - segHeight;

        segments.push({ x1, rectY, segWidth, segHeight, row, idx });
      }

      return { start_time, end_time, idx, segments };
    });
  }, [bassTranscriptionData, rowHeight, timeToPixels, width]);

  // Render: geometry is stable, only isActive changes with playheadTime
  const tolerance = 0.08;
  const glyphs = useMemo(() => {
    const gap = rectHeight != null ? rectHeight : 0;

    return noteGeometry.flatMap(({ start_time, end_time, idx, segments }) => {
      const els = [];

      for (const seg of segments) {
        // Base rectangle
        els.push(
          <rect
            key={`bass-rect-${idx}-r${seg.row}`}
            x={seg.x1}
            y={seg.rectY}
            width={seg.segWidth}
            height={seg.segHeight}
            fill={fillColor}
            opacity={opacity}
          />
        );

        // Divider topper
        if (dividerUrl) {
          const maskId = `bass-divider-mask-${idx}-r${seg.row}`;
          const baseTopperHeight = Math.max(4, rowHeight * 0.12);
          const h = Math.min(seg.segHeight, baseTopperHeight);
          const bottomOfTopper = seg.rectY - gap;
          const cx = seg.x1 + seg.segWidth / 2;
          const cy = bottomOfTopper - h / 2;

          els.push(
            <g
              key={`bass-div-${idx}-r${seg.row}`}
              transform={`translate(${cx}, ${cy}) rotate(180) translate(${
                -seg.segWidth / 2
              }, ${-h / 2})`}
            >
              <defs>
                <mask id={maskId}>
                  <image
                    href={dividerUrl}
                    x={0}
                    y={0}
                    width={seg.segWidth}
                    height={h}
                    preserveAspectRatio="none"
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                </mask>
              </defs>
              <rect
                x={0}
                y={0}
                width={seg.segWidth}
                height={h}
                fill={fillColor}
                opacity={opacity}
                mask={`url(#${maskId})`}
              />
            </g>
          );
        }
      }
      return els;
    });
  }, [noteGeometry, fillColor, opacity, rectHeight, dividerUrl, rowHeight]);

  return (
    <>
      {/* Only inject the filter definition if blur > 0 */}
      {blur > 0 && (
        <defs pointerEvents="none">
          <filter
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            filterUnits="objectBoundingBox"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} />
          </filter>
        </defs>
      )}

      {/* Apply blur to all bass glyphs as a group if enabled */}
      {blur > 0 ? <g filter={`url(#${filterId})`}>{glyphs}</g> : <>{glyphs}</>}
    </>
  );
}
