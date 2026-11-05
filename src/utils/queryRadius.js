// src/utils/queryRadius.js
// A query's search radius (Greg 2026-11-05): matches are shown only within `radius` bars of
// the query, either way (null = the whole song). Counted in whole bars, as a musician counts:
// the bar of the match's start against the bar of the query's first word (a line query: its
// line's first word); radius 1 = the query's bar and its neighbors. The
// engine still finds everything; the radius only filters what is shown, like the type pills.

const barOf = (song, t) => song.barPosition(t).bar;

/** The time the radius is measured from. */
export function queryOrigin(song, q) {
  if (q.kind === "line") return song.lines?.[q.lineIdx]?.words?.[0]?.start ?? null;
  return song.byId?.get(q.anchorIds?.[0])?.start ?? null;
}

/** Is time `start` within the query's radius? */
export function withinRadius(song, q, start) {
  if (q.radius == null || !song?.barPosition) return true;
  const o = queryOrigin(song, q);
  if (o == null || start == null) return true;
  return Math.abs(barOf(song, start) - barOf(song, o)) <= q.radius;
}

/** A match is shown when its type is on and it lies within the radius. */
export function showsMatch(song, q, m) {
  return q.types.has(m.type) && withinRadius(song, q, m.start);
}
