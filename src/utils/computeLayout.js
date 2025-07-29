// src/utils/computeLayout.js
export function computeLayout({
  duration,
  width,
  height,
  estimated_bpm = 103,
  barsPerRow = 8,
}) {
  // 1. Use provided duration
  const maxEndTime = duration || 0;

  // 2. Time-based grid calculation
  const secondsPerBar = (60 / estimated_bpm) * 4;
  const secondsPerRow = secondsPerBar * barsPerRow;
  const numberOfRows = Math.ceil(maxEndTime / secondsPerRow);

  // 3. Visual layout dimensions
  const rowHeight = height / numberOfRows;
  const columnWidth = width / barsPerRow;

  return {
    barsPerRow,
    estimated_bpm,
    secondsPerBar,
    secondsPerRow,
    numberOfRows,
    rowHeight,
    columnWidth,
    maxEndTime,
    width,
    height,
  };
}
