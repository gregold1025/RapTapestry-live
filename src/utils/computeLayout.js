// src/utils/computeLayout.js

export function computeLayout({
  transcriptionData,
  width,
  height,
  estimated_bpm = 103,
  barsPerRow = 8,
}) {
  // 1. Find the last word end time
  let maxEndTime = 0;
  transcriptionData.lines?.forEach((line) =>
    line.words?.forEach((word) => {
      if (word.end > maxEndTime) maxEndTime = word.end;
    })
  );

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
