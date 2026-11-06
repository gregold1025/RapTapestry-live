// src/contexts/QueryContext.jsx
// One query model for every layer. Two kinds of query, each its own thing:
// a WORD query (a word or a contiguous run) is drawn on words and syllables;
// (matches come from the protocol engine: identity in `type`, loosenings in `tags`)
// a LINE query (a line, matched to other lines by the end rhyme of their last
// words) is drawn on lines only. Matches come from the typed rhyme engine
// (src/engine). Color = query identity; type and form travel with each
// visual so layers can style them without a second lookup.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { sylRange, assonantSyllables } from "../utils/phoneMarks";
import { showsMatch } from "../utils/queryRadius";
import { useSongData } from "./SongDataContext";
import { queryReducer, initialQueryState, clickFocuses } from "./queryReducer";
import { visibleQueries, wordQueryInfo } from "../utils/queryView";
import { useUIState } from "./UIStateContext";
import { undoable, UNDO, REDO } from "./undoable";
import { isTypingTarget } from "../utils/isTypingTarget";
import { computeMatches, TYPE_RANK } from "../engine";
import { lineEndMatches } from "../engine/lineRhymes";
import { useSelectorStoreProvider, useSelectorStore, useStableActions } from "../utils/selectorStore";

const QueryContext = createContext(null);
const QueryStoreContext = createContext(null);

// Undo history over the query reducer; a change of focus alone is no step.
const historyReducer = undoable(queryReducer, initialQueryState, { transientIf: (a, b) => a.queries === b.queries });

export function QueryProvider({ children }) {
  const { songModel } = useSongData();
  const [history, dispatchRaw] = useReducer(historyReducer, undefined, () => historyReducer(undefined, { type: "@init" }));
  const state = history.present;
  const stateRef = useRef(state);
  stateRef.current = state;
  const { openQueries } = useUIState();
  // Solo: the focused-query panel's switch; while on, only the focused query is drawn.
  const [solo, setSolo] = useState(false);
  const visible = useMemo(() => visibleQueries(state.queries, state.focusedId, solo), [state.queries, state.focusedId, solo]);

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
  // The reducer asks which query a matched word (or line) is drawn in: a click opens what the eye sees.
  const drawnRef = useRef({ words: new Map(), lines: new Map() });
  const envRef = useRef(null);
  envRef.current = {
    flatOf: (id) => songModel?.byId.get(id)?.flat ?? -1,
    idAt: (f) => songModel?.words[f]?.id,
    lastWordOf: (li) => {
      const n = songModel?.lines?.[li]?.words?.length ?? 0;
      return n ? `${li}-${n - 1}` : null;
    },
    drawnOwner: (wordId) => drawnRef.current.words.get(wordId)?.queryId ?? null,
    drawnLineOwner: (li) => drawnRef.current.lines.get(li)?.queryId ?? null,
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
    for (const q of visible) {
      if (q.kind === "line") continue;
      for (const m of matchesByQueryId.get(q.id) ?? []) {
        const isAnchor = m.type === "anchor";
        if (!isAnchor && !showsMatch(songModel, q, m)) continue;
        for (const w of m.words) {
          const prev = map.get(w.id);
          const rank = TYPE_RANK[m.type] ?? 99;
          if (prev && prev.isAnchor && !isAnchor) continue;
          if (prev && !prev.isAnchor && !isAnchor && prev.rank < rank) continue;
          const { vi0, vi1 } = sylRange(m, w);
          const vowelOnly = isAnchor ? [] : [...assonantSyllables(m, w.id)];
          map.set(w.id, { queryId: q.id, color: q.color, type: m.type, form: m.form, tags: m.tags ?? [], vi0, vi1, vowelOnly, isAnchor, rank, text: m.text });
        }
      }
    }
    const prev = prevVisualRef.current;
    for (const [id, v] of map) {
      const b = prev.get(id);
      if (b && b.queryId === v.queryId && b.color === v.color && b.type === v.type && b.form === v.form && b.vi0 === v.vi0 && b.vi1 === v.vi1 && b.isAnchor === v.isAnchor && b.vowelOnly.join() === v.vowelOnly.join() && b.tags.join() === v.tags.join()) map.set(id, b);
    }
    prevVisualRef.current = map;
    return map;
  }, [visible, matchesByQueryId, songModel]);

  // Per-line visual (line queries only): the anchor line, and every matched
  // line at its lowest-ranked type; ties -> most recent query.
  const prevLineRef = useRef(new Map());
  const visualByLineIdx = useMemo(() => {
    const map = new Map();
    for (const q of visible) {
      if (q.kind !== "line") continue;
      const prevA = map.get(q.lineIdx);
      if (!prevA || !prevA.isAnchor) map.set(q.lineIdx, { queryId: q.id, color: q.color, role: "anchor", isAnchor: true, type: "anchor", rank: -1 });
      for (const lm of matchesByQueryId.get(q.id) ?? []) {
        if (lm.type === "anchor" || !showsMatch(songModel, q, lm)) continue;
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
  }, [visible, matchesByQueryId, songModel]);
  drawnRef.current = { words: visualByWordId, lines: visualByLineIdx };

  const snapshot = useMemo(() => ({ visualByWordId, visualByLineIdx }), [visualByWordId, visualByLineIdx]);
  const store = useSelectorStoreProvider(snapshot);

  const clickAndOpen = (action) => {
    const opens = clickFocuses(stateRef.current, action, envRef.current);
    dispatch(action);
    if (opens) openQueries();
  };
  // What the tapestry and Line Staff hover says about a word (the queries drawn only).
  const wordInfo = useCallback(
    (wordId) => wordQueryInfo(wordId, visible, matchesByQueryId, songModel, visualByWordId.get(wordId)?.queryId ?? null),
    [visible, matchesByQueryId, songModel, visualByWordId]
  );

  const actions = useStableActions({
    // a click that leaves a query focused (made or opened) also opens the Queries view
    click: (wordId, mods = {}) => clickAndOpen({ type: "click", wordId, shift: !!mods.shift, meta: !!mods.meta, alt: !!mods.alt, reveal: !!mods.reveal }),
    clickLine: (lineIdx, mods = {}) => clickAndOpen({ type: "clickLine", lineIdx, meta: !!mods.meta, alt: !!mods.alt, reveal: !!mods.reveal }),
    toggleSolo: () => setSolo((v) => !v),
    remove: (id) => dispatch({ type: "remove", id }),
    undo: () => dispatch({ type: UNDO }),
    redo: () => dispatch({ type: REDO }),
    toggleActive: (id) => dispatch({ type: "toggleActive", id }),
    setTypes: (id, types) => dispatch({ type: "setTypes", id, types }),
    setRadius: (id, radius) => dispatch({ type: "setRadius", id, radius, coalesce: `radius:${id}` }),   // a drag is one undo step
    setColor: (id, color) => dispatch({ type: "setColor", id, color, coalesce: `color:${id}` }),   // a drag is one undo step
    focus: (id) => dispatch({ type: "focus", id }),
    selectMatch: (h) => dispatch({ type: "highlight", highlight: h }),   // { wordId } or { lineIdx }
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
    () => ({ queries: state.queries, focusedId: state.focusedId, focused, highlight: state.highlight, solo, wordInfo, matchesByQueryId, visualByWordId, visualByLineIdx, songModel, canUndo: history.canUndo, canRedo: history.canRedo, ...actions }),
    [state.queries, state.focusedId, focused, state.highlight, solo, wordInfo, matchesByQueryId, visualByWordId, visualByLineIdx, songModel, history.canUndo, history.canRedo, actions]
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
