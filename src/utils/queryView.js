// src/utils/queryView.js
// What the views show of the queries.
//   visibleQueries: the queries drawn: every shown (eye on) query, or with solo on only the
//     focused one (solo hides the others; it is the focused-query panel's state, so it follows focus).
//   wordQueryInfo: what the tapestry and Line Staff hover says about a word: "query" and its
//     match count when it is a query's word, and the query word of every query it is a match of
//     (the one it is drawn in first, the one a click opens).
import { showsMatch } from "./queryRadius";

export function visibleQueries(queries, focusedId, solo) {
  const shown = queries.filter((q) => q.active);
  return solo && focusedId != null ? shown.filter((q) => q.id === focusedId) : shown;
}

const has = (m, wordId) => m.words?.some((w) => w.id === wordId);

export function wordQueryInfo(wordId, queries, matchesByQueryId, song, drawnId) {
  let query = null;
  const matchOf = [];
  for (const q of queries) {
    if (q.kind === "line") continue;
    const ms = matchesByQueryId.get(q.id) ?? [];
    if (q.anchorIds.includes(wordId)) {
      query = { id: q.id, count: ms.filter((m) => m.type !== "anchor" && showsMatch(song, q, m)).length };
      continue;
    }
    const m = ms.find((x) => x.type !== "anchor" && has(x, wordId) && showsMatch(song, q, x));
    if (m) matchOf.push({ id: q.id, word: q.anchorIds.map((id) => song?.byId?.get(id)?.text ?? id).join(" "), type: m.type });
  }
  matchOf.sort((a, b) => (b.id === drawnId) - (a.id === drawnId));
  return query || matchOf.length ? { query, matchOf } : null;
}

/** Is match `m` the one a click opened its query on (highlight: { wordId } or { lineIdx })? */
export function isHighlit(m, highlight) {
  if (!highlight) return false;
  if (highlight.lineIdx != null) return m.lineIdx === highlight.lineIdx;
  return has(m, highlight.wordId);
}
