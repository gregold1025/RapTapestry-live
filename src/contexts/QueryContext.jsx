// src/contexts/QueryContext.jsx
// One query model for every layer. A query is a word or a contiguous run of
// words; its matches come from the typed rhyme engine (src/engine). Lines are
// context (a line query is a query on the line's last word); syllables are the
// data the matches are drawn on. Color = query identity; type and form travel
// with each word's visual so layers can style them without a second lookup.
import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef } from "react";
import { useSongData } from "./SongDataContext";
import { queryReducer, initialQueryState } from "./queryReducer";
import { computeMatches, TYPE_RANK } from "../engine";
import { useSelectorStoreProvider, useSelectorStore, useStableActions } from "../utils/selectorStore";

const QueryContext = createContext(null);
const QueryStoreContext = createContext(null);

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
  const [state, dispatchRaw] = useReducer(queryReducer, initialQueryState);

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
    matchesFor: (anchorIds) => {
      const ids = [];
      for (const m of matchesFor(anchorIds)) if (m.type !== "anchor") for (const w of m.words) ids.push(w.id);
      return ids;
    },
  };
  const dispatch = useCallback((action) => dispatchRaw({ ...action, __env: envRef.current }), []);

  const matchesByQueryId = useMemo(() => {
    const out = new Map();
    for (const q of state.queries) out.set(q.id, matchesFor(q.anchorIds));
    return out;
  }, [state.queries, matchesFor]);

  // Per-word visual: anchors win; else the lowest-ranked type; ties -> most recent query.
  // Entries are reused from the previous map when unchanged so per-word subscribers
  // (useWordVisual) keep a stable reference and skip re-rendering.
  const prevVisualRef = useRef(new Map());
  const visualByWordId = useMemo(() => {
    const map = new Map();
    for (const q of state.queries) {
      if (!q.active) continue;
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

  // Per-line visual: the query of an anchor in the line, else of its best match.
  const visualByLineIdx = useMemo(() => {
    const map = new Map();
    for (const [wordId, v] of visualByWordId) {
      const li = Number(wordId.split("-")[0]);
      const prev = map.get(li);
      if (!prev || (v.isAnchor && !prev.isAnchor) || (!prev.isAnchor && v.rank < prev.rank)) {
        map.set(li, { queryId: v.queryId, color: v.color, role: v.isAnchor ? "anchor" : "match", rank: v.rank });
      }
    }
    return map;
  }, [visualByWordId]);

  const snapshot = useMemo(() => ({ visualByWordId, visualByLineIdx }), [visualByWordId, visualByLineIdx]);
  const store = useSelectorStoreProvider(snapshot);

  const lastWordIdOfLine = useCallback(
    (lineIdx) => {
      const line = songModel?.lines?.[lineIdx];
      const n = line?.words?.length ?? 0;
      return n ? `${lineIdx}-${n - 1}` : null;
    },
    [songModel]
  );

  const actions = useStableActions({
    click: (wordId, mods = {}) => dispatch({ type: "click", wordId, shift: !!mods.shift, meta: !!mods.meta, alt: !!mods.alt }),
    clickLine: (lineIdx, mods = {}) => {
      const id = lastWordIdOfLine(lineIdx);
      if (id) dispatch({ type: "click", wordId: id, shift: !!mods.shift, meta: !!mods.meta, alt: !!mods.alt });
    },
    remove: (id) => dispatch({ type: "remove", id }),
    toggleActive: (id) => dispatch({ type: "toggleActive", id }),
    setTypes: (id, types) => dispatch({ type: "setTypes", id, types }),
    setColor: (id, color) => dispatch({ type: "setColor", id, color }),
    focus: (id) => dispatch({ type: "focus", id }),
    clear: () => dispatch({ type: "clear" }),
  });

  const focused = state.queries.find((q) => q.id === state.focusedId) ?? null;

  const value = useMemo(
    () => ({ queries: state.queries, focusedId: state.focusedId, focused, matchesByQueryId, visualByWordId, visualByLineIdx, songModel, ...actions }),
    [state.queries, state.focusedId, focused, matchesByQueryId, visualByWordId, visualByLineIdx, songModel, actions]
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
