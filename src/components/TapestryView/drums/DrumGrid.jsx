// src/components/TapestryView/drums/DrumGrid.jsx
import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useAudioEngine } from "../../../contexts/AudioContext";
import { useParams } from "../../../contexts/ParamsContext";

export default function DrumGrid({ drumTranscriptionData }) {
  const { layout } = useTapestryLayout();
  const { playheadTime } = useAudioEngine();
  const { showDrums, showDownbeats, showBeatsLines } = useParams();

  if (!layout || !drumTranscriptionData) return null;

  const { rowHeight, timeToPixels, gridTimes, beatsPerBar } = layout;

  // Prefer the layout’s notion of beats for rendering (already inferred + aligned).
  // Still read raw transcription for reference / fallback.
  const {
    beats: beatsIn = [],
    downbeats: downbeatsIn = [],
    estimated_bpm,
    time_signature_beats, // e.g., 4 for 4/4
  } = drumTranscriptionData;

  // Determine beatsPerBar (priority: layout -> prop -> default 4)
  const tsBeats =
    Number(time_signature_beats) > 0 ? Number(time_signature_beats) : undefined;
  const beatsPerBarEffective =
    Number.isFinite(beatsPerBar) && beatsPerBar > 0
      ? beatsPerBar
      : tsBeats ?? 4;

  // === MODE A (ACTIVE): Derive downbeats by counting beats ===
  // Assumption: the VERY FIRST beat is the first downbeat (offset = 0).
  // Downbeats are every Nth beat where N = beatsPerBarEffective.
  const beats =
    Array.isArray(gridTimes) && gridTimes.length ? gridTimes : beatsIn;
  const derivedDownbeats = [];
  if (beats && beats.length) {
    for (let i = 0; i < beats.length; i++) {
      // Every Nth beat (i % N === 0) is a downbeat
      if (i % beatsPerBarEffective === 0) {
        derivedDownbeats.push(beats[i]);
      }
    }
    // Ensure we include t=0 downbeat if the first beat happens slightly after 0
    // (Optional – comment out if you do NOT want this)
    // if (beats[0] > 0 && derivedDownbeats.length && derivedDownbeats[0] !== 0) {
    //   derivedDownbeats.unshift(0);
    // }
  }

  // === MODE B (OLD / COMMENTED): Use provided downbeat list from transcription ===
  // const downbeats = Array.isArray(downbeatsIn) ? downbeatsIn : [];
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // NOTE: Leave the line above commented out to use the MODE A derivedDownbeats.
  // To compare: swap what's passed to the "draw downbeats" loop below.

  const lines = [];
  const tolerance = 0.08;

  // Draw downbeats (full height) — using MODE A (derived) by default:
  if (showDownbeats && showDrums && derivedDownbeats.length) {
    derivedDownbeats.forEach((t, i) => {
      const { x, y } = timeToPixels(t);
      const isActive = Math.abs(t - playheadTime) <= tolerance;
      lines.push(
        <line
          key={`downbeat-derived-${i}`}
          x1={x}
          y1={y + 0.5}
          x2={x}
          y2={y + rowHeight - 0.5}
          stroke="black"
          strokeWidth={3}
          opacity={0.2}
          vectorEffect="non-scaling-stroke"
        />
      );
    });
  }

  // // If you want to compare with the raw provided downbeats, temporarily replace the loop above with:
  // if (showDownbeats && showDrums && downbeats.length) {
  //   downbeats.forEach((t, i) => {
  //     const { x, y } = timeToPixels(t);
  //     const isActive = Math.abs(t - playheadTime) <= tolerance;
  //     lines.push(
  //       <line
  //         key={`downbeat-provided-${i}`}
  //         x1={x}
  //         y1={y + 0.5}
  //         x2={x}
  //         y2={y + rowHeight - 0.5}
  //         stroke="black"
  //         strokeWidth={3}
  //         opacity={isActive ? 0.7 : 0.4}
  //         vectorEffect="non-scaling-stroke"
  //       />
  //     );
  //   });
  // }

  // Draw beat lines (full height) from the *layout* beat grid so columns match rows
  if (showBeatsLines && showDrums && beats && beats.length) {
    beats.forEach((t, i) => {
      const { x, y } = timeToPixels(t);
      const isActive = Math.abs(t - playheadTime) <= tolerance;
      lines.push(
        <line
          key={`beat-${i}`}
          x1={x}
          y1={y + 0.5}
          x2={x}
          y2={y + rowHeight - 0.5}
          stroke="black"
          strokeWidth={1}
          opacity={0.2}
          vectorEffect="non-scaling-stroke"
        />
      );
    });
  }

  return <g className="drum-grid">{lines}</g>;
}
