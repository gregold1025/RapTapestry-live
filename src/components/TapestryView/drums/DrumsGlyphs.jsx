import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";

// Helper: consolidate events within a merge window
function mergeEvents({ downbeats, beats, drum_hits, mergeWindow }) {
  const events = [];

  // Wrap everything with source tags
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

  // Sort by time
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

// Helper: combine a group into a single reinforced event
function consolidateGroup(group) {
  const time = group.reduce((sum, ev) => sum + ev.time, 0) / group.length; // average time
  const combinedSources = {
    downbeat: group.some((e) => e.sources.downbeat),
    beat: group.some((e) => e.sources.beat),
    onset: group.some((e) => e.sources.onset),
  };
  const category = group.find((e) => e.sources.onset)?.category || "mid"; // prefer onset category if present
  const reinforcementCount =
    (combinedSources.downbeat ? 1 : 0) +
    (combinedSources.beat ? 1 : 0) +
    (combinedSources.onset ? 1 : 0);

  return { time, category, reinforcementCount };
}

// Helper: category to Y offset multiplier
function categoryYOffset(category, rowHeight) {
  switch (category) {
    case "low":
      return rowHeight * 0.9;
    case "high":
      return rowHeight * 0.6;
    default:
      return rowHeight * 0.75; // mid
  }
}

export default function DrumsGlyphs({ drumTranscriptionData }) {
  const { layout } = useTapestryLayout();
  if (!layout || !drumTranscriptionData) return null;

  const { estimated_bpm, secondsPerRow, rowHeight, width, numberOfRows } =
    layout;
  const { downbeats, beats, drum_hits } = drumTranscriptionData;

  // Merge window: 1/32 note in seconds
  const mergeWindow = (60 / estimated_bpm) * (4 / 32);

  // Consolidate and memoize events
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

  // Helper: convert time to SVG X/Y
  const timeToX = (t) => ((t % secondsPerRow) / secondsPerRow) * width;
  const timeToRow = (t) => Math.floor(t / secondsPerRow);

  return (
    <>
      {mergedEvents.map((ev, idx) => {
        const row = timeToRow(ev.time);
        const cx = timeToX(ev.time);
        const cy = row * rowHeight + categoryYOffset(ev.category, rowHeight);

        // Radius based on reinforcement count
        const radius = 1 + ev.reinforcementCount * 3; // base 4, +3 per source

        return (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={radius}
            fill="blue"
            opacity={0.8}
          />
        );
      })}
    </>
  );
}
