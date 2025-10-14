// src/utils/computeLayout.js

function secondsPerBeatFrom(bpm, timeSig) {
  // bpm = quarter-note BPM; convert to the "beat" unit implied by timeSig.den
  // If your beats[] are quarter notes, this reduces to 60 / bpm.
  const quarterSec = 60 / bpm;
  const beatUnitFactor = 4 / (timeSig?.den ?? 4); // e.g., 4/4 -> 1, 6/8 -> 0.5 (dotted-quarters vs quarters: adjust if needed)
  return quarterSec * beatUnitFactor;
}

export function computeLayout({
  duration,
  width,
  height,
  // NEW: prefer beats as the primary grid
  beats = [],
  // Kept for reference (you may still display them later if you want)
  downbeats = [],
  barsPerRow = 8,
  estimated_bpm,
  timeSig = { num: 4, den: 4 },
}) {
  // Minimal validation
  const haveBeats = Array.isArray(beats) && beats.length > 0;
  if (!duration || !estimated_bpm || !haveBeats) {
    console.warn("⚠️ computeLayout: need duration, estimated_bpm, and beats[]");
    return null;
  }

  // Beats per bar from time signature (e.g., 4 in 4/4, 3 in 3/4, 6 in 6/8)
  const beatsPerBar = timeSig.num * (4 / timeSig.den);
  const beatsPerRow = Math.max(1, Math.round(barsPerRow * beatsPerBar));

  const spBeat = secondsPerBeatFrom(estimated_bpm, timeSig);

  // --- Build a robust beat grid (gridTimes) with floor()-based inference
  const gridTimes = [];
  const beatInferred = [];

  // A) Pre-first-beat region: only backfill whole beats (floor)
  const first = beats[0];
  const missingBefore = Math.floor(first / spBeat);
  if (missingBefore >= 1) {
    let t = first - missingBefore * spBeat;
    for (let k = 0; k < missingBefore; k++) {
      gridTimes.push(t);
      beatInferred.push(true);
      t += spBeat;
    }
  }
  // Include all detected beats, bridging large gaps with inferred beats
  gridTimes.push(first);
  beatInferred.push(false);

  for (let i = 1; i < beats.length; i++) {
    const a = beats[i - 1];
    const b = beats[i];
    const gap = b - a;

    let beatCount = Math.floor(gap / spBeat);
    if (beatCount < 1) beatCount = 1;

    if (beatCount === 1) {
      gridTimes.push(b);
      beatInferred.push(false);
    } else {
      // Insert (beatCount - 1) inferred beats at regular spacing, then add detected b
      let t = a + spBeat;
      for (let k = 0; k < beatCount - 1; k++) {
        gridTimes.push(t);
        beatInferred.push(true);
        t += spBeat;
      }
      gridTimes.push(b);
      beatInferred.push(false);
    }
  }

  // B) Extend after last detected beat up to duration (floor-based)
  let last = gridTimes[gridTimes.length - 1];
  const remainBeats = Math.floor((duration - last) / spBeat);
  for (let k = 0; k < remainBeats; k++) {
    last += spBeat;
    gridTimes.push(last);
    beatInferred.push(true);
  }
  if (gridTimes[gridTimes.length - 1] < duration) {
    gridTimes.push(duration);
    beatInferred.push(true);
  }

  // --- Row boundaries every beatsPerRow
  const rowBoundaries = [];
  const rowBoundaryInferred = [];
  for (let i = 0; i < gridTimes.length; i += beatsPerRow) {
    rowBoundaries.push(gridTimes[i]);
    rowBoundaryInferred.push(beatInferred[i]);
  }
  if (rowBoundaries[rowBoundaries.length - 1] < duration) {
    rowBoundaries.push(duration);
    rowBoundaryInferred.push(true);
  }

  const numberOfRows = Math.max(1, rowBoundaries.length - 1);
  const rowHeight = height / numberOfRows;
  //const rowHeight = 500;
  const columnWidth = width / beatsPerRow;

  return {
    // layout
    width,
    height,
    numberOfRows,
    rowHeight,
    columnWidth,

    // grouping
    barsPerRow,
    beatsPerRow, // <— key for render math
    beatsPerBar, // derived from timeSig

    // timing
    rowBoundaries, // row start times (length = numberOfRows + 1)
    rowBoundaryInferred, // parallel flags
    gridTimes, // beat grid used for segmenting within each row
    beatInferred, // parallel flags
    secondsPerBeat: spBeat,
    timeSig,
    estimated_bpm,

    // for reference / UI legends if you still want them
    detectedBeats: beats,
    detectedDownbeats: downbeats,
  };
}
