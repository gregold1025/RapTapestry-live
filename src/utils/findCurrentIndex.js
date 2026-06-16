/**
 * Binary-search the index of the interval [starts[i], ends[i]) containing t.
 * `starts` must be ascending. Returns -1 if t is before all intervals or in a gap.
 * O(log n) — safe to call every animation frame.
 */
export function findCurrentIndex(starts, ends, t) {
  const n = starts.length;
  if (!n) return -1;
  let lo = 0;
  let hi = n - 1;
  // largest i with starts[i] <= t
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (starts[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  if (t < starts[lo]) return -1;
  return t < ends[lo] ? lo : -1;
}
