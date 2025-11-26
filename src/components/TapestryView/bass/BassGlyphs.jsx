import React, { useMemo, useState, useEffect, useCallback } from "react";
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
  const { playheadTime } = useAudioEngine();
  const { showBass, bassParams } = useParams();

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

  const tolerance = 0.08; // ~80ms visual playhead window

  // -------------------------------
  // DIVIDER GLYPH SELECTION STATE
  // -------------------------------
  const [dividerUrl, setDividerUrl] = useState(null);

  const pickRandomDivider = useCallback(() => {
    if (!BASS_DIVIDER_URLS.length) return;
    const idx = Math.floor(Math.random() * BASS_DIVIDER_URLS.length);
    setDividerUrl(BASS_DIVIDER_URLS[idx]);
  }, []);

  // Pressing "b" / "B" picks a new random divider glyph
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "b" || e.key === "B") {
        pickRandomDivider();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pickRandomDivider]);

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

      // pitch-based *top* of the energy column
      const baseY = (row) => row * rowHeight + rowHeight * 0.9 - binOffset;

      const segments = [];

      for (let row = startRow; row <= endRow; row++) {
        const x1 = row === startRow ? startX : 0;
        const x2 = row === endRow ? endX : width;
        const segWidth = Math.max(1, x2 - x1);

        const yTop = baseY(row);
        const rowBottom = (row + 1) * rowHeight;

        // height from note height up to bottom of the row
        let segHeight = rowBottom - yTop;
        segHeight = Math.max(1, segHeight);

        // -------------------------
        // 1) BASE RECTANGLE COLUMN
        // -------------------------
        const rectY = rowBottom - segHeight;
        segments.push(
          <rect
            key={`bass-rect-${idx}-r${row}`}
            x={x1}
            y={rectY}
            width={segWidth}
            height={segHeight}
            fill={fillColor}
            opacity={opacity}
          />
        );

        // -------------------------
        // 2) DIVIDER TOPPER GLYPH
        // -------------------------
        if (dividerUrl) {
          const maskId = `bass-divider-mask-${idx}-r${row}`;

          // rectHeight NOW means "gap" between column and topper
          const gap = rectHeight != null ? rectHeight : 0;

          // Height of the topper itself – purely aesthetic
          const baseTopperHeight = Math.max(4, rowHeight * 0.12);
          const h = Math.min(segHeight, baseTopperHeight);

          // Bottom of topper sits 'gap' units above top of rectangle
          const bottomOfTopper = rectY - gap;
          const cx = x1 + segWidth / 2;
          const cy = bottomOfTopper - h / 2;

          segments.push(
            <g
              key={`bass-div-${idx}-r${row}`}
              transform={`translate(${cx}, ${cy}) rotate(180) translate(${
                -segWidth / 2
              }, ${-h / 2})`}
            >
              <defs>
                <mask id={maskId}>
                  <image
                    href={dividerUrl}
                    x={0}
                    y={0}
                    width={segWidth}
                    height={h}
                    // stretch to span full width/height of the topper
                    preserveAspectRatio="none"
                    style={{
                      // ensure solid white for full opacity in mask
                      filter: "brightness(0) invert(1)",
                    }}
                  />
                </mask>
              </defs>

              <rect
                x={0}
                y={0}
                width={segWidth}
                height={h}
                fill={fillColor}
                opacity={opacity}
                mask={`url(#${maskId})`}
              />
            </g>
          );
        }
      }

      return segments;
    });
  }, [
    bassTranscriptionData,
    playheadTime,
    tolerance,
    rowHeight,
    timeToPixels,
    width,
    fillColor,
    opacity,
    rectHeight, // now interpreted as GAP
    dividerUrl,
  ]);

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
