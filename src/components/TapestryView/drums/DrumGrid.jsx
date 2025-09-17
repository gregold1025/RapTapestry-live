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

  const { rowHeight, timeToPixels } = layout;
  const {
    beats: beatsIn,
    downbeats: downbeatsIn,
    estimated_bpm,
    time_signature_beats, // optional, e.g., 4 for 4/4
  } = drumTranscriptionData;

  const timeSig =
    Number(time_signature_beats) > 0 ? Number(time_signature_beats) : 4;

  // If we don't have BPM or downbeats, draw what we have and bail
  const hasBpm = Number(estimated_bpm) > 0;
  const beats = Array.isArray(beatsIn) ? [...beatsIn] : [];
  const downbeats = Array.isArray(downbeatsIn) ? [...downbeatsIn] : [];

  // Helper: combine, de-dupe within epsilon, sort ascending
  const mergeTimes = (arrA, arrB, eps = 1e-4) => {
    const merged = [...arrA, ...arrB].sort((a, b) => a - b);
    const out = [];
    for (let t of merged) {
      if (out.length === 0 || Math.abs(t - out[out.length - 1]) > eps) {
        out.push(t);
      }
    }
    return out;
  };

  // Backfill from first downbeat to t=0 using BPM
  if (hasBpm && downbeats.length > 0) {
    const spb = 60 / estimated_bpm; // seconds per beat
    const bar = spb * timeSig;

    const firstDown = downbeats[0];
    const preBeats = [];
    const preDownbeats = [];

    if (firstDown > 0) {
      // ---- Beats: snap from firstDown to the nearest lower beat at/above 0
      // Take k = floor(firstDown / spb) so that t0 - k*spb is in [0, spb)
      const k = Math.floor(firstDown / spb);
      const firstBeatAtOrAbove0 = firstDown - k * spb; // in [0, spb)
      // If we want exactly 0 when firstBeatAtOrAbove0 is very close:
      const startBeat = firstBeatAtOrAbove0 < 1e-4 ? 0 : firstBeatAtOrAbove0;

      // Step backwards from firstDown to >= 0
      for (let t = firstDown; t >= 0; t -= spb) {
        const snapped = Math.max(0, t); // guard against tiny negatives
        preBeats.push(snapped);
        // Stop once we've gone below the first snapped beat near 0
        if (snapped === 0) break;
      }

      // ---- Downbeats: step back whole bars
      for (let t = firstDown; t >= 0; t -= bar) {
        const snapped = Math.max(0, t);
        preDownbeats.push(snapped);
        if (snapped === 0) break;
      }
    }

    // Merge with provided arrays
    const mergedBeats = mergeTimes(preBeats, beats);
    const mergedDownbeats = mergeTimes(preDownbeats, downbeats);

    // Replace references
    beats.length = 0;
    beats.push(...mergedBeats);

    downbeats.length = 0;
    downbeats.push(...mergedDownbeats);
  }

  // (Optional) If we have BPM but *no* downbeats at all, try to synthesize them:
  if (hasBpm && downbeats.length === 0 && beats.length > 0) {
    const spb = 60 / estimated_bpm;
    const bar = spb * timeSig;
    // Use the first beat as an anchor
    const anchor = beats[0];
    const synthDown = [];
    // walk from anchor down to 0
    for (let t = anchor; t >= 0; t -= bar) {
      const snapped = Math.max(0, t);
      synthDown.push(snapped);
      if (snapped === 0) break;
    }
    // and up to the last beat
    const lastBeat = beats[beats.length - 1];
    for (let t = anchor + bar; t <= lastBeat + 1e-4; t += bar) {
      synthDown.push(t);
    }
    const mergedDownbeats = mergeTimes(synthDown, downbeats);
    downbeats.length = 0;
    downbeats.push(...mergedDownbeats);
  }

  const lines = [];
  const tolerance = 0.08;

  // Draw downbeats (full height)
  if (showDownbeats && showDrums) {
    downbeats.forEach((t, i) => {
      const { x, y } = timeToPixels(t);
      const isActive = Math.abs(t - playheadTime) <= tolerance;
      lines.push(
        <line
          key={`downbeat-${i}`}
          x1={x}
          y1={y + 0.5} // half-px nudge to avoid top-edge clip
          x2={x}
          y2={y + rowHeight - 0.5}
          stroke="black"
          strokeWidth={3}
          opacity={isActive ? 0.7 : 0.4}
          vectorEffect="non-scaling-stroke"
        />
      );
    });
  }

  // Draw normal beats (full height)
  if (showBeatsLines && showDrums) {
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
          opacity={isActive ? 0.8 : 0.5}
          vectorEffect="non-scaling-stroke"
        />
      );
    });
  }

  return <g className="drum-grid">{lines}</g>;
}
