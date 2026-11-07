// src/components/ClockPane/clockCycles.js
// The Rhyme Clock's time model: one turn of the clock is one cycle of
// `cycleBars` bars (1, 2 or 4). Bars are the intervals between downbeats;
// past the last downbeat, bars of the median length are added until they
// cover the song. Within a cycle each bar is an equal share of the turn and
// time is linear inside the bar, so a tempo drift does not skew the beats.
// Before the first downbeat (or with no bar grid) a time is in cycle -1.

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * @param {number[]} downbeats  bar start times (s), increasing
 * @param {1|2|4} cycleBars     bars per turn
 * @param {number} duration     song length (s)
 */
export function makeCycles(downbeats, cycleBars, duration) {
  const db = (downbeats ?? []).filter(Number.isFinite);
  const n = Math.max(1, cycleBars | 0);
  if (db.length < 2) {
    return { count: 0, cycleBars: n, cycleOf: () => -1, fracOf: () => 0, timeAt: () => 0, start: () => 0 };
  }
  // extend the grid past the end of the song
  const lengths = db.slice(1).map((t, i) => t - db[i]).filter((d) => d > 0);
  const barLen = lengths.length ? median(lengths) : 2;
  const grid = [...db];
  const end = Math.max(duration ?? 0, db[db.length - 1]);
  while (grid[grid.length - 1] < end) grid.push(grid[grid.length - 1] + barLen);
  const nBars = grid.length - 1;
  // pad so every cycle has its full complement of bars
  while ((grid.length - 1) % n) grid.push(grid[grid.length - 1] + barLen);
  const count = Math.ceil(nBars / n);

  // index of the bar holding t (largest i with grid[i] <= t), clamped to the grid
  const barOf = (t) => {
    let lo = 0, hi = grid.length - 2;
    if (t >= grid[hi]) return hi;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (grid[mid] <= t) lo = mid; else hi = mid - 1;
    }
    return lo;
  };

  const cycleOf = (t) => (t < grid[0] ? -1 : Math.floor(barOf(t) / n));
  const fracOf = (t) => {
    if (t < grid[0]) return 0;
    const b = barOf(t);
    const phase = Math.min(1, (t - grid[b]) / (grid[b + 1] - grid[b]));
    return Math.min(0.999999, ((b % n) + phase) / n);
  };
  const timeAt = (cycle, frac) => {
    const u = Math.max(0, Math.min(1, frac)) * n;
    const b = Math.min(grid.length - 2, Math.max(0, cycle) * n + Math.min(n - 1, Math.floor(u)));
    const phase = u - Math.min(n - 1, Math.floor(u));
    return grid[b] + phase * (grid[b + 1] - grid[b]);
  };
  const start = (cycle) => grid[Math.min(grid.length - 1, Math.max(0, cycle) * n)];

  return { count, cycleBars: n, cycleOf, fracOf, timeAt, start };
}
