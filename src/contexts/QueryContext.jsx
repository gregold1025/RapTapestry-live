// src/contexts/QueryContext.jsx
// One query model for every layer. Two kinds of query, each its own thing:
// a WORD query (a word or a contiguous run) is drawn on words and syllables;
// a LINE query (a line, matched to other lines by the end rhyme of their last
// words) is drawn on lines only. Matches come from the typed rhyme engine
// (src/engine). Color = query identity; type and form travel with each
// visual so layers can style them without a second lookup.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { useSongData } from "./SongDataContext";
import { queryReducer, initialQueryState } from "./queryReducer";
import { undoable, UNDO, REDO } from "./undoable";
import { isTypingTarget } from "../utils/isTypingTarget";
import { computeMatches, TYPE_RANK } from "../engine";
import { lineEndMatches } from "../engine/lineRhymes";
import { useSelectorStoreProvider, useSelectorStore, useStableActions } from "../utils/selectorStore";

const QueryContext = createContext(null);
const QueryStoreContext = createContext(null);

// Undo history over the query reducer; a change of focus alone is no step.
const historyReducer = undoable(queryReducer, initialQueryState, { transientIf: (a, b) => a.queries === b.queries });

/** Which syllables of `w` a match covers (first word from vi0, last word to vi1). */
function sylRangeFor(m, w) {
  const n = w.nSyllables ?? 1;
  if (m.form === "word" || m.type === "anchor") {
    const vi0 = m.type === "anchor" ? 0 : Math.max(0, Math.min(n - 1, m.lead ? 0 : (w.rime?.stressedSyl ?? 0)));
    return { vi0, vi1: n - 1 };
  }
  const first = m.words[0] === w, last = m.words[m.words.length - 1] === w;
  return { vi0: first ? (m.vi0 ?? 0) : 0, vi1: last ? (m.vi1 ?? n - 1) : n - 1 };
}

export function QueryProvider({ children }) {
  const { songModel } = useSongData();
  const [history, dispatchRaw] = useReducer(historyReducer, undefined, () => historyReducer(undefined, { type: "@init" }));
  const state = history.present;

  // Match cache per anchor run (engine results do not depend on query options).
  const cacheRef = useRef(new Map());
  const matchesFor = useCallback(
    (anchorIds) => {
      if (!songModel) return [];
      const key = anchorIds.join("|");
      let m = cacheRef.current.get(key);
      if (!m) {
        m = computeMatches(songModel, anchorIds);
        cacheRef.current.set(key, m);
      }
      return m;
    },
    [songModel]
  );
  // The reducer wants plain word-id lists for "is this word a match".
  const envRef = useRef(null);
  envRef.current = {
    flatOf: (id) => songModel?.byId.get(id)?.flat ?? -1,
    idAt: (f) => songModel?.words[f]?.id,
    // words the query currently shows as matches (its rhyme types only)
    matchesFor: (q) => {
      const ids = [];
      for (const m of matchesFor(q.anchorIds)) if (m.type !== "anchor" && q.types.has(m.type)) for (const w of m.words) ids.push(w.id);
      return ids;
    },
    lastWordOf: (li) => {
      const n = songModel?.lines?.[li]?.words?.length ?? 0;
      return n ? `${li}-${n - 1}` : null;
    },
    // lines the line query currently shows as matches
    lineMatchesFor: (q) => (songModel ? lineEndMatches(songModel, q.lineIdx, matchesFor) : []).filter((lm) => q.types.has(lm.type)).map((lm) => lm.lineIdx),
  };
  const dispatch = useCallback((action) => dispatchRaw({ ...action, __env: envRef.current }), []);

  // Word queries: the engine's matches. Line queries: end-rhyme matches, one
  // per line, from the line's last one to three words (engine/lineRhymes).
  const matchesByQueryId = useMemo(() => {
    const out = new Map();
    for (const q of state.queries) {
      out.set(q.id, q.kind === "line" ? (songModel ? lineEndMatches(songModel, q.lineIdx, matchesFor) : []) : matchesFor(q.anchorIds));
    }
    return out;
  }, [state.queries, matchesFor, songModel]);

  // Per-word visual (word queries only): anchors win; else the lowest-ranked
  // type; ties -> most recent query.
  // Entries are reused from the previous map when unchanged so per-word subscribers
  // (useWordVisual) keep a stable reference and skip re-rendering.
  const prevVisualRef = useRef(new Map());
  const visualByWordId = useMemo(() => {
    const map = new Map();
    for (const q of state.queries) {
      if (!q.active || q.kind === "line") continue;
      for (const m of matchesByQueryId.get(q.id) ?? []) {
        const isAnchor = m.type === "anchor";
        if (!isAnchor && !q.types.has(m.type)) continue;
        for (const w of m.words) {
          const prev = map.get(w.id);
          const rank = TYPE_RANK[m.type] ?? 99;
          if (prev && prev.isAnchor && !isAnchor) continue;
          if (prev && !prev.isAnchor && !isAnchor && prev.rank < rank) continue;
          const { vi0, vi1 } = sylRangeFor(m, w);
          map.set(w.id, { queryId: q.id, color: q.color, type: m.type, form: m.form, vi0, vi1, isAnchor, rank, expected: !!m.expected, text: m.text });
        }
      }
    }
    const prev = prevVisualRef.current;
    for (const [id, v] of map) {
      const b = prev.get(id);
      if (b && b.queryId === v.queryId && b.color === v.color && b.type === v.type && b.form === v.form && b.vi0 === v.vi0 && b.vi1 === v.vi1 && b.isAnchor === v.isAnchor && b.expected === v.expected) map.set(id, b);
    }
    prevVisualRef.current = map;
    return map;
  }, [state.queries, matchesByQueryId]);

  // Per-line visual (line queries only): the anchor line, and every matched
  // line at its lowest-ranked type; ties -> most recent query.
  const prevLineRef = useRef(new Map());
  const visualByLineIdx = useMemo(() => {
    const map = new Map();
    for (const q of state.queries) {
      if (!q.active || q.kind !== "line") continue;
      const prevA = map.get(q.lineIdx);
      if (!prevA || !prevA.isAnchor) map.set(q.lineIdx, { queryId: q.id, color: q.color, role: "anchor", isAnchor: true, type: "anchor", rank: -1 });
      for (const lm of matchesByQueryId.get(q.id) ?? []) {
        if (lm.type === "anchor" || !q.types.has(lm.type)) continue;
        const prev = map.get(lm.lineIdx);
        const rank = TYPE_RANK[lm.type] ?? 99;
        if (prev && (prev.isAnchor || prev.rank < rank)) continue;
        map.set(lm.lineIdx, { queryId: q.id, color: q.color, role: "match", isAnchor: false, type: lm.type, form: lm.form, rank, text: lm.text });
      }
    }
    const prev = prevLineRef.current;
    for (const [li, v] of map) {
      const b = prev.get(li);
      if (b && b.queryId === v.queryId && b.color === v.color && b.role === v.role && b.type === v.type && b.form === v.form) map.set(li, b);
    }
    prevLineRef.current = map;
    return map;
  }, [state.queries, matchesByQueryId]);

  const snapshot = useMemo(() => ({ visualByWordId, visualByLineIdx }), [visualByWordId, visualByLineIdx]);
  const store = useSelectorStoreProvider(snapshot);

  const actions = useStableActions({
    click: (wordId, mods = {}) => dispatch({ type: "click", wordId, shift: !!mods.shift, meta: !!mods.meta, alt: !!mods.alt }),
    clickLine: (lineIdx, mods = {}) => dispatch({ type: "clickLine", lineIdx, meta: !!mods.meta, alt: !!mods.alt }),
    remove: (id) => dispatch({ type: "remove", id }),
    undo: () => dispatch({ type: UNDO }),
    redo: () => dispatch({ type: REDO }),
    toggleActive: (id) => dispatch({ type: "toggleActive", id }),
    setTypes: (id, types) => dispatch({ type: "setTypes", id, types }),
    setColor: (id, color) => dispatch({ type: "setColor", id, color, coalesce: `color:${id}` }),   // a drag is one undo step
    focus: (id) => dispatch({ type: "focus", id }),
    clear: () => dispatch({ type: "clear" }),
  });

  const focused = state.queries.find((q) => q.id === state.focusedId) ?? null;

  // Cmd-Z / Cmd-Shift-Z (Ctrl on other platforms) undo and redo the queries,
  // except while typing in a text field.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      dispatch({ type: e.shiftKey ? REDO : UNDO });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  const value = useMemo(
    () => ({ queries: state.queries, focusedId: state.focusedId, focused, matchesByQueryId, visualByWordId, visualByLineIdx, songModel, canUndo: history.canUndo, canRedo: history.canRedo, ...actions }),
    [state.queries, state.focusedId, focused, matchesByQueryId, visualByWordId, visualByLineIdx, songModel, history.canUndo, history.canRedo, actions]
  );
  const storeValue = useMemo(() => ({ store, actions }), [store, actions]);

  return (
    <QueryStoreContext.Provider value={storeValue}>
      <QueryContext.Provider value={value}>{children}</QueryContext.Provider>
    </QueryStoreContext.Provider>
  );
}

export function useQueries() {
  const ctx = useContext(QueryContext);
  if (!ctx) throw new Error("useQueries must be used within a QueryProvider");
  return ctx;
}

/** Stable mutators only; never re-renders. */
export function useQueryActions() {
  return useContext(QueryStoreContext).actions;
}

/** Per-word subscription: re-renders only when THIS word's visual changes. */
export function useWordVisual(wordId) {
  const { store } = useContext(QueryStoreContext);
  return useSelectorStore(store, useMemo(() => (snap) => snap.visualByWordId.get(wordId) ?? null, [wordId]));
}

/** Per-line subscription. */
export function useLineVisual(lineIdx) {
  const { store } = useContext(QueryStoreContext);
  return useSelectorStore(store, useMemo(() => (snap) => snap.visualByLineIdx.get(lineIdx) ?? null, [lineIdx]));
}
