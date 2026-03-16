// src/contexts/lyricsContexts/LineSelectionContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { useParams } from "../ParamsContext";
import { extractLines, getMatchingLinesFor } from "../../utils/extractLines";
import { getThreshold } from "../../utils/phonemeSimilarity.js";
import { generateDistinctColor } from "../../utils/selectionColors.js";

// ---- Types ------------------------------------------------------------------

export type LineSelectionParams = Partial<{
  rhymeStrictness: number;
  rhymeSearchDistance: number;
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

// ---- Provider ---------------------------------------------------------------

export function LineSelectionProvider({ transcriptionData, children }) {
  const [selections, setSelections] = useState<LineSelection[]>([]);
  const { exactMatches, ignorePlurals, rhymeStrictness } = useParams();

  const extracted = useMemo(() => {
    return extractLines(transcriptionData, { ignorePlurals });
  }, [transcriptionData, ignorePlurals]);

  function resolveParams(sel: LineSelection): ResolvedLineParams {
    const p = sel.params ?? {};
    return {
      rhymeStrictness:     p.rhymeStrictness     ?? rhymeStrictness,
      rhymeSearchDistance: p.rhymeSearchDistance ?? 999,
      exactMatches:        p.exactMatches        ?? exactMatches,
    };
  }

  function computeMatchSet(sel: LineSelection): Set<number> {
    const p = resolveParams(sel);
    const threshold = p.exactMatches ? null : getThreshold(p.rhymeStrictness, "rhyme");
    const raw =
      getMatchingLinesFor(extracted, sel.lineIdx, { exactMatches: p.exactMatches, threshold }) ??
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
  }, [selections, exactMatches, extracted, rhymeStrictness]);

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

  function getVisualForLine(lineIdx: number): VisualForLine {
    for (let i = activeInZOrder.length - 1; i >= 0; i--) {
      const s = activeInZOrder[i];
      if (s.lineIdx === lineIdx)
        return { role: "anchor", color: s.color, selectionId: s.id };
    }
    for (let i = activeInZOrder.length - 1; i >= 0; i--) {
      const s = activeInZOrder[i];
      const set = matchesBySelectionId[s.id];
      if (set?.has?.(lineIdx))
        return { role: "match", color: s.color, selectionId: s.id };
    }
    return null;
  }

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
    setLineInteractionStamp(Date.now());
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

  return (
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
          if (id) setLineInteractionStamp(Date.now());
        },
        lineInteractionStamp,
      }}
    >
      {children}
    </LineSelectionContext.Provider>
  );
}

export function useLineSelection() {
  return useContext(LineSelectionContext);
}
