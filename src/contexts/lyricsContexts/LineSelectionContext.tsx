// src/contexts/lyricsContexts/LineSelectionContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { useParams } from "../ParamsContext";
import { extractLines, getMatchingLinesFor } from "../../utils/extractLines";

type LineSelection = {
  id: string;
  lineIdx: number;
  color: string;
  label?: string;
  active: boolean;
  createdAt: number;
};

type VisualForLine =
  | { role: "anchor"; color: string; selectionId: string }
  | { role: "match"; color: string; selectionId: string }
  | null;

const DEFAULT_PALETTE = [
  "#FF0000",
  "#0000FF",
  "#00FF00",
  "#FF8000",
  "#8000FF",
  "#00FFFF",
  "#FFFF00",
  "#FF00FF",
  "#408000",
  "#800000",
  "#804000",
  "#400080",
];

const LineSelectionContext = createContext<any>(null);

export function LineSelectionProvider({ transcriptionData, children }) {
  const [selections, setSelections] = useState<LineSelection[]>([]);
  const { exactMatches, ignorePlurals } = useParams();

  // Extract once per data/param change
  const extracted = useMemo(() => {
    return extractLines(transcriptionData, { ignorePlurals });
  }, [transcriptionData, ignorePlurals]);

  // Helper: compute a fresh match set for a given line index
  function computeMatchSet(idx: number): Set<number> {
    return (
      getMatchingLinesFor(extracted, idx, { exactMatches }) ?? new Set<number>()
    );
  }

  // Fast lookup: which selections anchor a given line?
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

  // Compute matches per selection (active only)
  const matchesBySelectionId: Record<string, Set<number>> = useMemo(() => {
    const out: Record<string, Set<number>> = {};
    for (const s of selections) {
      if (!s.active) continue;
      out[s.id] = computeMatchSet(s.lineIdx);
    }
    return out;
  }, [selections, exactMatches, extracted]);

  // Last-created active selection is visually "on top"
  const activeInZOrder = useMemo(
    () =>
      selections
        .filter((s) => s.active)
        .sort((a, b) => a.createdAt - b.createdAt),
    [selections]
  );

  // Decide what a given line should look like (null = no highlight)
  function getVisualForLine(lineIdx: number): VisualForLine {
    // 1) if the line is an anchor for any active selection, show the topmost anchor color
    for (let i = activeInZOrder.length - 1; i >= 0; i--) {
      const s = activeInZOrder[i];
      if (s.lineIdx === lineIdx)
        return { role: "anchor", color: s.color, selectionId: s.id };
    }
    // 2) else if it matches any active selection, show the topmost match color
    for (let i = activeInZOrder.length - 1; i >= 0; i--) {
      const s = activeInZOrder[i];
      const set = matchesBySelectionId[s.id];
      if (set?.has?.(lineIdx))
        return { role: "match", color: s.color, selectionId: s.id };
    }
    return null;
  }

  // ---- Mutators -------------------------------------------------------------

  function addSelection(
    lineIdx: number,
    opts?: { color?: string; label?: string }
  ) {
    const nextColor =
      opts?.color ??
      DEFAULT_PALETTE[selections.length % DEFAULT_PALETTE.length];

    const sel: LineSelection = {
      id: nanoid(),
      lineIdx,
      color: nextColor,
      label: opts?.label,
      active: true,
      createdAt: Date.now(),
    };
    setSelections((prev) => [...prev, sel]);
    return sel.id;
  }

  function removeSelection(id: string) {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  }

  function clearSelections() {
    setSelections([]);
  }

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

  /**
   * Anchor collision-aware action:
   * - If the clicked line already belongs to an existing selection's match set,
   *   adopt that selection and repoint its anchor to the clicked line.
   * - Otherwise, create a new selection.
   * - Afterward, dedupe: keep only one selection per match group (the adopted one).
   */
  function anchorOrAdopt(lineIdx: number) {
    setSelections((prev) => {
      // 1) find candidate to adopt (most recently created active selection whose matches include the line)
      let adopt: LineSelection | null = null;
      const withMatches: Array<{ s: LineSelection; matches: Set<number> }> = [];
      for (const s of prev) {
        if (!s.active) continue;
        const m = computeMatchSet(s.lineIdx);
        withMatches.push({ s, matches: m });
        if (m.has(lineIdx) || s.lineIdx === lineIdx) {
          if (!adopt || s.createdAt > adopt.createdAt) adopt = s;
        }
      }

      // 2) produce next list: update the adopted selection or create a new one
      let next = [...prev];
      if (adopt) {
        next = next.map((s) => (s.id === adopt!.id ? { ...s, lineIdx } : s));
      } else {
        const nextColor = DEFAULT_PALETTE[next.length % DEFAULT_PALETTE.length];
        next = [
          ...next,
          {
            id: nanoid(),
            lineIdx,
            color: nextColor,
            active: true,
            createdAt: Date.now(),
          } as LineSelection,
        ];
      }

      // 3) Dedupe: keep only one selection per match group.
      //    Strategy: compute matches for the adopted (or newly created) id,
      //    and drop any other selection whose anchor is inside that set OR
      //    whose matches contain our anchor (mutual match).
      const adoptedId = adopt ? adopt.id : next[next.length - 1].id;
      const adopted = next.find((s) => s.id === adoptedId)!;
      const adoptedSet = computeMatchSet(adopted.lineIdx);

      next = next.filter((s) => {
        if (s.id === adoptedId) return true;
        const sSet = computeMatchSet(s.lineIdx);
        const sameGroup =
          adoptedSet.has(s.lineIdx) || sSet.has(adopted.lineIdx);
        return !sameGroup; // remove if same group
      });

      return next;
    });
  }

  // (Optional) one-at-a-time legacy compat: last active selection’s anchor
  const selectedLineIdx = activeInZOrder.length
    ? activeInZOrder[activeInZOrder.length - 1].lineIdx
    : null;

  console.log(selections);

  return (
    <LineSelectionContext.Provider
      value={{
        // data
        selections,
        extracted,
        matchesBySelectionId,
        anchorsByLineIdx,
        // helpers
        getVisualForLine,
        // mutators
        addSelection, // still available if needed
        anchorOrAdopt, // ← use this for clicks/gestures
        removeSelection,
        clearSelections,
        toggleSelectionActive,
        setSelectionColor,
        updateSelection,
        // legacy
        selectedLineIdx,
      }}
    >
      {children}
    </LineSelectionContext.Provider>
  );
}

export function useLineSelection() {
  return useContext(LineSelectionContext);
}
