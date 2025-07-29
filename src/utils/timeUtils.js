// src/utils/timeUtils.js

export function getRowIndex(t, rowBoundaries) {
  for (let i = 0; i < rowBoundaries.length - 1; i++) {
    if (t >= rowBoundaries[i] && t < rowBoundaries[i + 1]) return i;
  }
  return rowBoundaries.length - 2; // clamp to last row
}

export function timeToPixels(
  t,
  rowBoundaries,
  downbeats,
  width,
  rowHeight,
  barsPerRow
) {
  // Step 1: Find the row
  const row = getRowIndex(t, rowBoundaries);
  const rowStartIndex = row * barsPerRow;
  const rowEndIndex = rowStartIndex + barsPerRow;
  const rowDownbeats = downbeats.slice(rowStartIndex, rowEndIndex + 1);
  const rowEndTime = rowBoundaries[row + 1];
  const columnWidth = width / barsPerRow;

  // Step 2: Find which downbeat segment this time is in
  let segmentIndex = 0;
  for (let i = 0; i < rowDownbeats.length - 1; i++) {
    if (t >= rowDownbeats[i] && t < rowDownbeats[i + 1]) {
      segmentIndex = i;
      break;
    }
  }

  const segStart = rowDownbeats[segmentIndex];
  const segEnd = rowDownbeats[segmentIndex + 1] ?? rowEndTime;

  // Step 3: Map local time to segment
  const localTime = t - segStart;
  const segmentDuration = segEnd - segStart;
  const segmentProgress = segmentDuration > 0 ? localTime / segmentDuration : 0;

  // Step 4: Combine
  const x = segmentIndex * columnWidth + segmentProgress * columnWidth;
  const y = row * rowHeight;

  return { x, y, row, segmentIndex };
}
