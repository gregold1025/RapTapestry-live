// src/components/TapestryView/drums/DrumGrid.jsx
import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useAudioEngine } from "../../../contexts/AudioContext";

export default function DrumGrid({ drumTranscriptionData }) {
  const { layout } = useTapestryLayout();
  const { playheadTime } = useAudioEngine();
  if (!layout || !drumTranscriptionData) return null;

  const { rowHeight, timeToPixels } = layout;
  const { beats, downbeats } = drumTranscriptionData;

  const lines = [];

  const tolerance = 0.08;

  // Draw downbeats (full height)
  downbeats.forEach((t, i) => {
    const { x, y } = timeToPixels(t);
    // Highlight if playhead is "on" this event
    const isActive = Math.abs(downbeats[i] - playheadTime) <= tolerance;
    const strokeWidth = 3;
    const stroke = "black";
    lines.push(
      <line
        key={`downbeat-${i}`}
        x1={x}
        y1={y}
        x2={x}
        y2={y + rowHeight}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={0.4}
      />
    );
  });

  // Draw normal beats (full height)
  beats.forEach((t, i) => {
    const { x, y } = timeToPixels(t);

    const isActive = Math.abs(beats[i] - playheadTime) <= tolerance;
    const strokeWidth = 1;
    const stroke = "black";
    lines.push(
      <line
        key={`beat-${i}`}
        x1={x}
        y1={y}
        x2={x}
        y2={y + rowHeight}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={0.5}
      />
    );
  });

  return <g className="drum-grid">{lines}</g>;
}
