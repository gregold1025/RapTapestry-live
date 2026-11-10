// src/contexts/queryReducer.js
// Pure state for queries. Two kinds, each its own thing:
//   word: one word or a contiguous run of words (anchorIds in song order)
//   line: a line (lineIdx); it matches other lines by end rhyme, and is drawn
//         on lines only. Its anchorIds hold the line's last word for the engine.
// Both carry a color and the rhyme types they show.
//
// Click rules (env.drawnOwner(wordId, state) names the query whose color a matched word is
// drawn in, so a click opens what the eye sees; env.drawnLineOwner the same for lines):
//   plain click on a free word        -> new query, focused
//   plain click on a query's anchor   -> focus that query
//   plain click on a query's match    -> focus that query and highlight the match (nothing moves)
//   shift-click                       -> extend the focused query to the contiguous run
//                                        (no focused query: behaves like a plain click)
//   meta (cmd/ctrl)                   -> a new query, even on a match, unless the word is
//                                        already a query's anchor (then focus it)
//   alt-click                         -> remove the query that owns the word (anchor or match)
//   reveal (a plain click on the tapestry or the Line Staff, which also scrubs)
//                                     -> the plain-click rules, but never a new query
// The same rules hold for a line (clickLine) and its line queries.
import { nanoid } from "nanoid";
import { generateDistinctColor } from "../utils/selectionColors.js";
import { RHYME_TYPES } from "../engine/rhymeTypes.js";

export const DEFAULT_TYPES = RHYME_TYPES.filter((t) => t.on).map((t) => t.key);

// highlight: the match a click opened the focused query on ({ wordId } or { lineIdx }), or null
export const initialQueryState = { queries: [], focusedId: null, highlight: null };

function ownerOf(state, wordId, env) {
  // a word query's anchor first (most recent), else the query the word is drawn in
  const anchor = [...state.queries].reverse().find((q) => q.kind !== "line" && q.anchorIds.includes(wordId));
  if (anchor) return { q: anchor, role: "anchor" };
  const id = env.drawnOwner(wordId, state);
  const match = id != null && state.queries.find((q) => q.id === id);
  return match ? { q: match, role: "match" } : null;
}

function ownerOfLine(state, lineIdx, env) {
  const anchor = [...state.queries].reverse().find((q) => q.kind === "line" && q.lineIdx === lineIdx);
  if (anchor) return { q: anchor, role: "anchor" };
  const id = env.drawnLineOwner(lineIdx, state);
  const match = id != null && state.queries.find((q) => q.id === id);
  return match ? { q: match, role: "match" } : null;
}

function focusOn(state, id, highlight = null) {
  const same = (a, b) => a === b || (a && b && a.wordId === b.wordId && a.lineIdx === b.lineIdx);
  return state.focusedId === id && same(state.highlight, highlight) ? state : { ...state, focusedId: id, highlight };
}

function removeQuery(state, id) {
  const queries = state.queries.filter((q) => q.id !== id);
  const focusedId = state.focusedId === id ? (queries.length ? queries[queries.length - 1].id : null) : state.focusedId;
  return { queries, focusedId, highlight: focusedId === state.focusedId ? state.highlight : null };
}

/**
 * The queries of a loaded session that this song can still show (Greg 2026-11-09): a word query
 * whose words are all here, a line query whose line is here; the rest dropped and counted.
 */
export function restorableQueries(queries, hasWord, lineCount) {
  if (!Array.isArray(queries)) return { queries: [], dropped: 0 };
  const ok = (q) => !!q && typeof q.id === "string" && Array.isArray(q.anchorIds) && (q.kind === "line"
    ? Number.isInteger(q.lineIdx) && q.lineIdx >= 0 && q.lineIdx < lineCount
    : q.anchorIds.length > 0 && q.anchorIds.every(hasWord));
  // repair what a hand-edited file may get wrong, so drawing never meets a bad query (review fix)
  const colors = [];
  const kept = queries.filter(ok).map((q) => {
    const types = q.types instanceof Set ? q.types : Array.isArray(q.types) ? new Set(q.types) : new Set(DEFAULT_TYPES);
    const color = typeof q.color === "string" && q.color ? q.color : generateDistinctColor([...colors, ...queries.map((x) => x?.color).filter((c) => typeof c === "string")]);
    colors.push(color);
    return { ...q, types, color, radius: typeof q.radius === "number" ? q.radius : null, active: typeof q.active === "boolean" ? q.active : true };
  });
  return { queries: kept, dropped: queries.length - kept.length };
}

/** Does this click (click or clickLine) leave a query focused? Not an alt-click, nor a reveal on a free word. */
export function clickFocuses(state, action, env) {
  if (action.alt) return false;
  if (!action.reveal) return true;
  return action.type === "clickLine" ? !!ownerOfLine(state, action.lineIdx, env) : !!ownerOf(state, action.wordId, env);
}

function newQuery(state, anchorIds, extra = {}) {
  return {
    id: nanoid(),
    kind: "word",
    anchorIds,
    ...extra,
    color: generateDistinctColor(state.queries.map((q) => q.color)),
    active: true,
    createdAt: Date.now(),
    types: new Set(DEFAULT_TYPES),
    radius: null,   // search radius in bars either way; null = the whole song
  };
}

export function queryReducer(state, action, env = action.__env) {
  switch (action.type) {
    case "click": {
      const { wordId, shift, meta, alt, reveal } = action;
      if (alt) {
        const own = ownerOf(state, wordId, env);
        return own ? removeQuery(state, own.q.id) : state;
      }
      if (shift && !reveal) {
        const focused = state.queries.find((q) => q.id === state.focusedId);
        if (focused) {
          const flats = [...focused.anchorIds, wordId].map(env.flatOf).filter((f) => f >= 0);
          const lo = Math.min(...flats), hi = Math.max(...flats);
          const anchorIds = [];
          for (let f = lo; f <= hi; f++) anchorIds.push(env.idAt(f));
          return { ...state, queries: state.queries.map((q) => (q.id === focused.id ? { ...q, anchorIds } : q)) };
        }
        // no focused query: fall through to a plain click
      }
      const own = ownerOf(state, wordId, env);
      // a word that is already a query is focused, never duplicated (cmd-click included)
      if (own?.role === "anchor") return focusOn(state, own.q.id);
      if (own?.role === "match" && !meta) return focusOn(state, own.q.id, { wordId });
      if (reveal) return state;
      const q = newQuery(state, [wordId]);
      return { queries: [...state.queries, q], focusedId: q.id, highlight: null };
    }
    case "clickLine": {
      const { lineIdx, meta, alt, reveal } = action;
      const last = env.lastWordOf(lineIdx);
      if (last == null) return state;
      const own = ownerOfLine(state, lineIdx, env);
      if (alt) return own ? removeQuery(state, own.q.id) : state;
      if (own?.role === "anchor") return focusOn(state, own.q.id);
      if (own?.role === "match" && !meta) return focusOn(state, own.q.id, { lineIdx });
      if (reveal) return state;
      const q = newQuery(state, [last], { kind: "line", lineIdx });
      return { queries: [...state.queries, q], focusedId: q.id, highlight: null };
    }
    case "remove":
      return removeQuery(state, action.id);
    case "toggleActive":
      return { ...state, queries: state.queries.map((q) => (q.id === action.id ? { ...q, active: !q.active } : q)) };
    case "setTypes":
      return { ...state, queries: state.queries.map((q) => (q.id === action.id ? { ...q, types: new Set(action.types) } : q)) };
    case "setRadius":
      return { ...state, queries: state.queries.map((q) => (q.id === action.id ? { ...q, radius: action.radius ?? null } : q)) };
    case "setColor":
      return { ...state, queries: state.queries.map((q) => (q.id === action.id ? { ...q, color: action.color } : q)) };
    case "focus":
      return state.queries.some((q) => q.id === action.id) ? focusOn(state, action.id) : state;
    case "highlight":   // a match picked in the focused query's list
      return state.focusedId == null ? state : focusOn(state, state.focusedId, action.highlight ?? null);
    case "clear":
      return initialQueryState;
    default:
      return state;
  }
}
