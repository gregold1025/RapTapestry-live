// src/utils/computeLayout.js
export function computeLayout({
  duration,
  width,
  height,
  downbeats = [],
  barsPerRow = 8,
}) {
  if (!downbeats || downbeats.length === 0) {
    console.warn("⚠️ No downbeats provided to computeLayout");
    return null;
  }

  // 1. Build row boundaries based on downbeats
  const rowBoundaries = [];
  for (let i = 0; i < downbeats.length; i += barsPerRow) {
    rowBoundaries.push(downbeats[i]);
  }

  // Ensure the last row ends at either the final downbeat or duration
  if (rowBoundaries[rowBoundaries.length - 1] < duration) {
    rowBoundaries.push(duration);
  }

  const numberOfRows = rowBoundaries.length - 1;

  // 2. Visual layout dimensions
  const rowHeight = height / numberOfRows;
  const columnWidth = width / barsPerRow;

  return {
    barsPerRow,
    rowBoundaries, // times at which each row starts
    numberOfRows,
    rowHeight,
    columnWidth,
    width,
    height,
  };
}
