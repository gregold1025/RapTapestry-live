// src/contexts/queryReducer.js
// Pure state for queries: each query is one word or a contiguous run of words
// (anchorIds in song order), with a color and the rhyme types it shows.
//
// Click rules (env.matchesFor(q) tells us which words a query currently SHOWS as
// matches, i.e. filtered by the query's rhyme types, so adopt follows what is drawn):
//   plain click on a free word        -> new query, focused
//   plain click on a query's anchor   -> focus that query
//   plain click on a query's match    -> adopt: that query's anchor moves here (rhyme gravity)
//   shift-click                       -> extend the focused query to the contiguous run
//                                        (no focused query: behaves like a plain click)
//   cmd/ctrl-click                    -> always a new query
//   alt-click                         -> remove the query that owns the word (anchor or match)
import { nanoid } from "nanoid";
import { generateDistinctColor } from "../utils/selectionColors.js";
import { RHYME_TYPES } from "../engine/rhymeTypes.js";

export const DEFAULT_TYPES = RHYME_TYPES.filter((t) => t.on).map((t) => t.key);

export const initialQueryState = { queries: [], focusedId: null };

function ownerOf(state, wordId, env) {
  // most recent query first, anchors before matches
  const rev = [...state.queries].reverse();
  const anchor = rev.find((q) => q.anchorIds.includes(wordId));
  if (anchor) return { q: anchor, role: "anchor" };
  const match = rev.find((q) => q.active && env.matchesFor(q).includes(wordId));
  if (match) return { q: match, role: "match" };
  return null;
}

function newQuery(state, anchorIds) {
  return {
    id: nanoid(),
    anchorIds,
    color: generateDistinctColor(state.queries.map((q) => q.color)),
    active: true,
    createdAt: Date.now(),
    types: new Set(DEFAULT_TYPES),
  };
}

export function queryReducer(state, action, env = action.__env) {
  switch (action.type) {
    case "click": {
      const { wordId, shift, meta, alt } = action;
      if (alt) {
        const own = ownerOf(state, wordId, env);
        if (!own) return state;
        const queries = state.queries.filter((q) => q.id !== own.q.id);
        return { queries, focusedId: queries.length ? queries[queries.length - 1].id : null };
      }
      if (shift) {
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
      if (!meta) {
        const own = ownerOf(state, wordId, env);
        if (own?.role === "anchor") return { ...state, focusedId: own.q.id };
        if (own?.role === "match") {
          return {
            queries: state.queries.map((q) => (q.id === own.q.id ? { ...q, anchorIds: [wordId] } : q)),
            focusedId: own.q.id,
          };
        }
      }
      const q = newQuery(state, [wordId]);
      return { queries: [...state.queries, q], focusedId: q.id };
    }
    case "remove": {
      const queries = state.queries.filter((q) => q.id !== action.id);
      const focusedId = state.focusedId === action.id ? (queries.length ? queries[queries.length - 1].id : null) : state.focusedId;
      return { queries, focusedId };
    }
    case "toggleActive":
      return { ...state, queries: state.queries.map((q) => (q.id === action.id ? { ...q, active: !q.active } : q)) };
    case "setTypes":
      return { ...state, queries: state.queries.map((q) => (q.id === action.id ? { ...q, types: new Set(action.types) } : q)) };
    case "setColor":
      return { ...state, queries: state.queries.map((q) => (q.id === action.id ? { ...q, color: action.color } : q)) };
    case "focus":
      return state.queries.some((q) => q.id === action.id) ? { ...state, focusedId: action.id } : state;
    case "clear":
      return initialQueryState;
    default:
      return state;
  }
}
