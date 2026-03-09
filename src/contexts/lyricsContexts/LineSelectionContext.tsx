// src/contexts/lyricsContexts/LineSelectionContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { useParams } from "../ParamsContext";
import { extractLines, getMatchingLinesFor } from "../../utils/extractLines";
import { getThreshold } from "../../utils/phonemeSimilarity.js";

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

function colorToHue(color: string): number | null {
  if (!color) return null;
  const m = color.match(/hsl\(\s*(\d+)/);
  if (m) return parseInt(m[1]);
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return null;
    const d = max - min;
    let h: number;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return Math.round(h * 360);
  }
  return null;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

function generateDistinctColor(existingColors: string[]): string {
  const existingHues = existingColors.map(colorToHue).filter((h): h is number => h !== null);
  const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  for (let i = 0; i < 40; i++) {
    const hue = Math.floor(Math.random() * 360);
    if (existingHues.every((eh) => hueGap(hue, eh) >= 35)) return hslToHex(hue, 78, 52);
  }
  let bestHue = 0, bestMin = -1;
  for (let h = 0; h < 360; h += 3) {
    const minD = existingHues.length === 0 ? 180 : Math.min(...existingHues.map((eh) => hueGap(h, eh)));
    if (minD > bestMin) { bestMin = minD; bestHue = h; }
  }
  return hslToHex(bestHue, 78, 52);
}

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
      }}
    >
      {children}
    </LineSelectionContext.Provider>
  );
}

export function useLineSelection() {
  return useContext(LineSelectionContext);
}
