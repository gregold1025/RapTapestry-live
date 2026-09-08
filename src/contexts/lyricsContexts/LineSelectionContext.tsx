// src/contexts/lyricsContexts/LineSelectionContext.tsx
import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { useSelectorStoreProvider, useSelectorStore, useStableActions } from "../../utils/selectorStore";
import { nanoid } from "nanoid";
import { useParams } from "../ParamsContext";
import { extractLines, getMatchingLinesFor } from "../../utils/extractLines";
import { getThreshold, getCodaThreshold } from "../../utils/phonemeSimilarity.js";
import { generateDistinctColor } from "../../utils/selectionColors.js";
import { nextStamp } from "../../utils/interactionCounter.js";

// ---- Types ------------------------------------------------------------------

export type LineSelectionParams = Partial<{
  rhymeStrictness: number;
  rhymeSearchDistance: number;
  codaTolerance: number;
  exactMatches: boolean;
}>;

type ResolvedLineParams = Required<LineSelectionParams>;

type LineSelection = {
  id: string;
  lineIdx: number;
  color: string;
  label?: string;
  active: boolean;
  createdAt: number;
  params?: LineSelectionParams;
};

type VisualForLine =
  | { role: "anchor"; color: string; selectionId: string }
  | { role: "match"; color: string; selectionId: string }
  | null;

const LineSelectionContext = createContext<any>(null);
// Per-line subscription store + stable actions.
const LineSelectionStoreContext = createContext<any>(null);

// ---- Provider ---------------------------------------------------------------

export function LineSelectionProvider({ transcriptionData, children }) {
  const [selections, setSelections] = useState<LineSelection[]>([]);
  const { exactMatches, rhymeStrictness, codaTolerance } = useParams();

  const extracted = useMemo(() => {
    return extractLines(transcriptionData);
  }, [transcriptionData]);

  function resolveParams(sel: LineSelection): ResolvedLineParams {
    const p = sel.params ?? {};
    return {
      rhymeStrictness:     p.rhymeStrictness     ?? rhymeStrictness,
      rhymeSearchDistance: p.rhymeSearchDistance ?? 999,
      codaTolerance:       p.codaTolerance       ?? codaTolerance,
      exactMatches:        p.exactMatches        ?? exactMatches,
    };
  }

  function computeMatchSet(sel: LineSelection): Set<number> {
    const p = resolveParams(sel);
    const nucleusThreshold = p.exactMatches ? null : getThreshold(p.rhymeStrictness, "rhyme");
    const codaThreshold = nucleusThreshold != null ? getCodaThreshold(nucleusThreshold, p.codaTolerance, p.rhymeStrictness) : null;
    const raw =
      getMatchingLinesFor(extracted, sel.lineIdx, { exactMatches: p.exactMatches, nucleusThreshold, codaThreshold }) ??
      new Set<number>();
    if (p.rhymeSearchDistance >= 999) return raw;
    return new Set([...raw].filter((i) => Math.abs(i - sel.lineIdx) <= p.rhymeSearchDistance));
  }

  const anchorsByLineIdx: Map<number, LineSelection[]> = useMemo(() => {
    const map = new Map<number, LineSelection[]>();
    for (const s of selections) {
      if (!s.active) continue;
      const arr = map.get(s.lineIdx) ?? [];
      arr.push(s);
      map.set(s.lineIdx, arr);
    }
    return map;
  }, [selections]);

  const matchesBySelectionId: Record<string, Set<number>> = useMemo(() => {
    const out: Record<string, Set<number>> = {};
    for (const s of selections) {
      if (!s.active) { out[s.id] = new Set(); continue; }
      out[s.id] = computeMatchSet(s);
    }
    return out;
  }, [selections, exactMatches, extracted, rhymeStrictness, codaTolerance]);

  const activeInZOrder = useMemo(
    () => selections.filter((s) => s.active).sort((a, b) => a.createdAt - b.createdAt),
    [selections]
  );

  const [manualFocusLineId, setManualFocusLineId] = useState<string | null>(null);
  const [lineInteractionStamp, setLineInteractionStamp] = useState<number>(0);

  const focusedLineSelId: string | null = useMemo(() => {
    if (manualFocusLineId && selections.some((s) => s.id === manualFocusLineId))
      return manualFocusLineId;
    return activeInZOrder.length ? activeInZOrder[activeInZOrder.length - 1].id : null;
  }, [manualFocusLineId, selections, activeInZOrder]);

  // Visual per line, precomputed once per change (was a per-call scan).
  // Most recent active selection wins for anchors, then for matches; entries
  // are reused from the previous map when unchanged so per-line subscribers
  // (useLineVisual) keep a stable reference.
  const prevLineVisualRef = useRef<Map<number, VisualForLine>>(new Map());
  const visualByLineIdx: Map<number, VisualForLine> = useMemo(() => {
    const map = new Map<number, VisualForLine>();
    for (const s of activeInZOrder) {
      map.set(s.lineIdx, { role: "anchor", color: s.color, selectionId: s.id });
    }
    for (const s of activeInZOrder) {
      const set = matchesBySelectionId[s.id];
      if (!set) continue;
      for (const lineIdx of set) {
        const cur = map.get(lineIdx);
        if (cur && cur.role === "anchor") continue;
        map.set(lineIdx, { role: "match", color: s.color, selectionId: s.id });
      }
    }
    const prev = prevLineVisualRef.current;
    for (const [lineIdx, v] of map) {
      const b = prev.get(lineIdx);
      if (b && v && b.role === v.role && b.color === v.color && b.selectionId === v.selectionId) map.set(lineIdx, b);
    }
    prevLineVisualRef.current = map;
    return map;
  }, [activeInZOrder, matchesBySelectionId]);

  function getVisualForLine(lineIdx: number): VisualForLine {
    return visualByLineIdx.get(lineIdx) ?? null;
  }

  const latestSelectionByLineIdx: Map<number, LineSelection> = useMemo(() => {
    const m = new Map<number, LineSelection>();
    for (const s of selections) {
      const cur = m.get(s.lineIdx);
      if (!cur || s.createdAt > cur.createdAt) m.set(s.lineIdx, s);
    }
    return m;
  }, [selections]);

  const lineSnapshot = useMemo(
    () => ({ visualByLineIdx, latestSelectionByLineIdx }),
    [visualByLineIdx, latestSelectionByLineIdx]
  );
  const lineStore = useSelectorStoreProvider(lineSnapshot);

  // ---- Mutators -------------------------------------------------------------

  function addSelection(lineIdx: number, opts?: { color?: string; label?: string }) {
    const nextColor = opts?.color ?? generateDistinctColor(selections.map((s) => s.color));
    const sel: LineSelection = {
      id: nanoid(), lineIdx, color: nextColor, label: opts?.label,
      active: true, createdAt: Date.now(),
    };
    setSelections((prev) => [...prev, sel]);
    return sel.id;
  }

  function removeSelection(id: string) {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  }

  function clearSelections() { setSelections([]); }

  function toggleSelectionActive(id: string) {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  }

  function setSelectionColor(id: string, color: string) {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s))
    );
  }

  function updateSelection(id: string, patch: Partial<LineSelection>) {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function setSelectionParams(id: string, patch: LineSelectionParams) {
    setSelections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, params: { ...(s.params ?? {}), ...patch } } : s
      )
    );
  }

  function clearSelectionParams(id: string) {
    setSelections((prev) => prev.map((s) => (s.id === id ? { ...s, params: {} } : s)));
  }

  function anchorOrAdopt(lineIdx: number) {
    setManualFocusLineId(null);
    setLineInteractionStamp(nextStamp());
    setSelections((prev) => {
      let adopt: LineSelection | null = null;
      for (const s of prev) {
        if (!s.active) continue;
        const m = computeMatchSet(s);
        if (m.has(lineIdx) || s.lineIdx === lineIdx) {
          if (!adopt || s.createdAt > adopt.createdAt) adopt = s;
        }
      }

      let next = [...prev];
      if (adopt) {
        next = next.map((s) => (s.id === adopt!.id ? { ...s, lineIdx } : s));
      } else {
        const nextColor = generateDistinctColor(next.map((s) => s.color));
        next = [
          ...next,
          { id: nanoid(), lineIdx, color: nextColor, active: true, createdAt: Date.now() } as LineSelection,
        ];
      }

      const adoptedId = adopt ? adopt.id : next[next.length - 1].id;
      const adopted = next.find((s) => s.id === adoptedId)!;
      const adoptedSet = computeMatchSet(adopted);

      next = next.filter((s) => {
        if (s.id === adoptedId) return true;
        const sSet = computeMatchSet(s);
        return !(adoptedSet.has(s.lineIdx) || sSet.has(adopted.lineIdx));
      });

      return next;
    });
  }

  const selectedLineIdx = activeInZOrder.length
    ? activeInZOrder[activeInZOrder.length - 1].lineIdx
    : null;

  const lineActions = useStableActions({ anchorOrAdopt, removeSelection, addSelection });
  const lineStoreValue = useMemo(() => ({ store: lineStore, actions: lineActions }), [lineStore, lineActions]);

  return (
    <LineSelectionStoreContext.Provider value={lineStoreValue}>
    <LineSelectionContext.Provider
      value={{
        selections,
        extracted,
        matchesBySelectionId,
        anchorsByLineIdx,
        getVisualForLine,
        addSelection,
        anchorOrAdopt,
        removeSelection,
        clearSelections,
        toggleSelectionActive,
        setSelectionColor,
        updateSelection,
        setSelectionParams,
        clearSelectionParams,
        selectedLineIdx,
        focusedLineSelId,
        setFocusedLineSelId: (id: string | null) => {
          setManualFocusLineId(id);
          if (id) setLineInteractionStamp(nextStamp());
        },
        lineInteractionStamp,
      }}
    >
      {children}
    </LineSelectionContext.Provider>
    </LineSelectionStoreContext.Provider>
  );
}

export function useLineSelection() {
  return useContext(LineSelectionContext);
}

/** Stable mutators only; never causes a re-render. */
export function useLineSelectionActions() {
  return useContext(LineSelectionStoreContext).actions;
}

/** Per-line subscription: re-renders only when THIS line's visual/anchor changes. */
export function useLineVisual(lineIdx: number): { vis: VisualForLine; anchorForThisLine: LineSelection | null } {
  const { store } = useContext(LineSelectionStoreContext);
  const vis = useSelectorStore(store, useMemo(() => (snap: any) => snap.visualByLineIdx.get(lineIdx) ?? null, [lineIdx]));
  const anchorForThisLine = useSelectorStore(store, useMemo(() => (snap: any) => snap.latestSelectionByLineIdx.get(lineIdx) ?? null, [lineIdx]));
  return { vis, anchorForThisLine };
}
