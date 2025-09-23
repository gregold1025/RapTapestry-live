// src/utils/timeUtils.js

export function getRowIndex(t, rowBoundaries) {
  if (!rowBoundaries || rowBoundaries.length < 2) return 0;
  if (t < rowBoundaries[0]) return 0; // clamp left
  for (let i = 0; i < rowBoundaries.length - 1; i++) {
    if (t >= rowBoundaries[i] && t < rowBoundaries[i + 1]) return i;
  }
  return rowBoundaries.length - 2; // clamp right
}

export function timeToPixels(
  t,
  rowBoundaries,
  gridTimes, // beats-based grid (from layout.gridTimes)
  width,
  rowHeight,
  segmentsPerRow // pass layout.beatsPerRow
) {
  // 1) Row
  const row = getRowIndex(t, rowBoundaries);
  const rowStartIndex = row * segmentsPerRow;
  const rowEndIndex = rowStartIndex + segmentsPerRow;

  const rowSegments = (gridTimes || []).slice(rowStartIndex, rowEndIndex + 1);
  const rowStartTime = rowBoundaries[row];
  const rowEndTime = rowBoundaries[row + 1];
  const columnWidth = width / segmentsPerRow;

  // Fallback if row has no segment markers
  if (rowSegments.length < 2) {
    const span = Math.max(1e-6, rowEndTime - rowStartTime);
    const progress = Math.max(0, Math.min(1, (t - rowStartTime) / span));
    return { x: progress * width, y: row * rowHeight, row, segmentIndex: 0 };
  }

  // 2) Find segment within row
  let segmentIndex = 0;
  for (let i = 0; i < rowSegments.length - 1; i++) {
    if (t >= rowSegments[i] && t < rowSegments[i + 1]) {
      segmentIndex = i;
      break;
    }
    if (i === rowSegments.length - 2 && t >= rowSegments[i + 1]) {
      segmentIndex = rowSegments.length - 2;
    }
  }

  const segStart = rowSegments[segmentIndex] ?? rowStartTime;
  const segEnd =
    rowSegments[segmentIndex + 1] !== undefined
      ? rowSegments[segmentIndex + 1]
      : rowEndTime;

  // 3) Local mapping
  const localTime = t - segStart;
  const segmentDuration = Math.max(1e-6, segEnd - segStart);
  const segmentProgress = localTime / segmentDuration;

  // 4) Combine
  const x = segmentIndex * columnWidth + segmentProgress * columnWidth;
  const y = row * rowHeight;

  return { x, y, row, segmentIndex };
}
