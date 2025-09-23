// src/components/TapestryView/drums/DrumsGlyphs.jsx
import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useAudioEngine } from "../../../contexts/AudioContext";
import { useParams } from "../../../contexts/ParamsContext";

// Y offset for category
function hitYOffset(category, rowHeight) {
  switch (category) {
    case "high":
      return rowHeight * 0.25;
    case "mid":
      return rowHeight * 0.375;
    case "low":
    default:
      return rowHeight * 0.5;
  }
}

// clamp helper
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function DrumsGlyphs({ drumTranscriptionData }) {
  const { layout } = useTapestryLayout();
  const { playheadTime } = useAudioEngine();
  const { showDrums, showDrumGlyphs, drumParams } = useParams();

  if (!layout || !drumTranscriptionData || !showDrums || !showDrumGlyphs)
    return null;

  const { rowHeight, timeToPixels } = layout;
  const { drum_hits } = drumTranscriptionData;

  // Use ONLY drum_hits (no merging, no downbeats/beats)
  const hits = useMemo(() => {
    if (!Array.isArray(drum_hits)) return [];
    return drum_hits
      .filter((h) => h && Number.isFinite(h.time))
      .sort((a, b) => a.time - b.time);
  }, [drum_hits]);

  const tolerance = 0.08; // ~80ms window if you ever want to highlight
  const {
    strokeWeight = 2,
    fillColor = "#bbbbbb",
    tilt = 10,
    opacity = 0.8,
  } = drumParams || {};

  // enforce tilt range and convert to radians
  const tiltDeg = clamp(tilt, -60, 60);
  const tiltRad = (tiltDeg * Math.PI) / 180;

  const glyphs = hits.map((hit, idx) => {
    const { x, y } = timeToPixels(hit.time);
    const lineHeight = rowHeight * 0.25;
    const y1 = y + hitYOffset(hit.category, rowHeight);
    const y2 = y1 + lineHeight;

    // keep the line centered at x; skew is Δx across full height
    const halfDx = (Math.tan(tiltRad) * lineHeight) / 2;

    // Highlight if playhead is "on" this hit (kept but off by default)
    const isActive = false; // Math.abs(hit.time - playheadTime) <= tolerance;
    const stroke = isActive ? "red" : fillColor;

    return (
      <line
        pointerEvents="none"
        key={`glyph-${idx}`}
        x1={x + halfDx}
        y1={y1}
        x2={x - halfDx}
        y2={y2}
        stroke={stroke}
        strokeWidth={strokeWeight}
        opacity={opacity}
        vectorEffect="non-scaling-stroke"
      />
    );
  });

  return <>{glyphs}</>;
}
