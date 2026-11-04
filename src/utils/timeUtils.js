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

/** Inverse of the per-row x mapping: content x (within a row) -> time. */
export function xToTime(x, gridTimes, columnWidth) {
  if (!gridTimes || gridTimes.length < 2 || !columnWidth) return 0;
  const n = gridTimes.length - 1;
  const raw = x / columnWidth;
  const i = Math.max(0, Math.min(n - 1, Math.floor(raw)));
  const frac = Math.max(0, Math.min(1, raw - i));
  if (raw <= 0) return gridTimes[0];
  if (raw >= n) return gridTimes[n];
  return gridTimes[i] + frac * (gridTimes[i + 1] - gridTimes[i]);
}

/** Content point (x, y) -> time, for wrap rows or the single scroll row. */
export function pointToTime(x, y, lay) {
  const { gridTimes, beatsPerRow, columnWidth, rowHeight, numberOfRows = 1 } = lay;
  const row = Math.max(0, Math.min(numberOfRows - 1, Math.floor(y / rowHeight)));
  const seg = gridTimes.slice(row * beatsPerRow, row * beatsPerRow + beatsPerRow + 1);
  const xx = Math.max(0, Math.min(seg.length > 1 ? (seg.length - 1) * columnWidth : 0, x));
  return xToTime(xx, seg, columnWidth);
}
