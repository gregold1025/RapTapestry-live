import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useAudioEngine } from "../../../contexts/AudioContext";
import { useParams } from "../../../contexts/ParamsContext";

// Merge logic (same as before)
function mergeEvents({ downbeats, beats, drum_hits, mergeWindow }) {
  const events = [];
  downbeats.forEach((t) =>
    events.push({ time: t, sources: { downbeat: true }, category: "mid" })
  );
  beats.forEach((t) =>
    events.push({ time: t, sources: { beat: true }, category: "mid" })
  );
  drum_hits.forEach((hit) =>
    events.push({
      time: hit.time,
      sources: { onset: true },
      category: hit.category,
    })
  );

  events.sort((a, b) => a.time - b.time);

  const merged = [];
  let currentGroup = [];
  for (const ev of events) {
    if (
      currentGroup.length === 0 ||
      ev.time - currentGroup[currentGroup.length - 1].time <= mergeWindow
    ) {
      currentGroup.push(ev);
    } else {
      merged.push(consolidateGroup(currentGroup));
      currentGroup = [ev];
    }
  }
  if (currentGroup.length) merged.push(consolidateGroup(currentGroup));
  return merged;
}

function consolidateGroup(group) {
  const time = group.reduce((sum, ev) => sum + ev.time, 0) / group.length;
  const combinedSources = {
    downbeat: group.some((e) => e.sources.downbeat),
    beat: group.some((e) => e.sources.beat),
    onset: group.some((e) => e.sources.onset),
  };
  const category = group.find((e) => e.sources.onset)?.category || "mid";
  return { time, category, sources: combinedSources };
}

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
  const { showDrums, drumParams } = useParams();

  if (!layout || !drumTranscriptionData || !showDrums) return null;

  const { rowHeight, timeToPixels } = layout;
  const { downbeats, beats, drum_hits, estimated_bpm } = drumTranscriptionData;

  const mergeWindow = (60 / (estimated_bpm || 103)) * (4 / 32);

  const mergedEvents = useMemo(
    () =>
      mergeEvents({
        downbeats,
        beats,
        drum_hits,
        mergeWindow,
      }),
    [downbeats, beats, drum_hits, mergeWindow]
  );

  const tolerance = 0.08; // ~20ms
  const {
    strokeWeight = 2,
    fillColor = "#bbbbbb",
    tilt = 10,
    opacity = 0.8,
  } = drumParams || {};

  // enforce the requested tilt range and convert to radians
  const tiltDeg = clamp(tilt, -20, 20);
  const tiltRad = (tiltDeg * Math.PI) / 180;

  const glyphs = mergedEvents.map((ev, idx) => {
    const { x, y } = timeToPixels(ev.time);
    const lineHeight = rowHeight * 0.25;
    const y1 = y + hitYOffset(ev.category, rowHeight);
    const y2 = y1 + lineHeight;

    // keep the line centered at x; skew is Δx across full height
    const halfDx = (Math.tan(tiltRad) * lineHeight) / 2;

    // Highlight if playhead is "on" this event (kept but disabled)
    const isActive = false; // Math.abs(ev.time - playheadTime) <= tolerance;
    const stroke = isActive ? "red" : fillColor;

    return (
      <line
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
