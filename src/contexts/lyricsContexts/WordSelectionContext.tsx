// src/contexts/lyricsContexts/WordSelectionContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { useParams } from "../ParamsContext";
import { extractRhymingWords } from "../../utils/extractRhymingWords";
import { extractAlliterativeWords } from "../../utils/extractAlliterations";

/**
 * Word ids use the form `${lineIdx}-${wordIdx}`
 */
type WordSelection = {
  id: string;
  wordId: string; // e.g., "12-5"
  color: string;
  label?: string;
  active: boolean;
  createdAt: number;
};

type VisualForWord =
  | { role: "anchor"; color: string; selectionId: string }
  | { role: "match"; color: string; selectionId: string }
  | { role: "alliteration"; color: string; selectionId: string }
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

const WordSelectionContext = createContext<any>(null);

function splitWordId(wordId: string): { lineIdx: number; wordIdx: number } {
  const [a, b] = String(wordId ?? "")
    .split("-")
    .map((n) => +n);
  return { lineIdx: a, wordIdx: b };
}

function phonesOf(word: any): string {
  if (!word) return "";
  const ph = Array.isArray(word.phones) ? word.phones[0] : word.phones || "";
  return String(ph || "");
}

export function WordSelectionProvider({
  transcriptionData,
  children,
}: {
  transcriptionData: any;
  children: React.ReactNode;
}) {
  const [selections, setSelections] = useState<WordSelection[]>([]);

  // Visual / logical params
  const {
    exactMatches,
    ignorePlurals,
    showRhymes, // gates rendering only
    showAlliteration, // gates rendering only
  } = useParams();

  const lines = transcriptionData?.lines ?? [];

  // Build a map of all wordIds -> phones (first phones string)
  const wordPhonesMap: Map<string, string> = useMemo(() => {
    const map = new Map<string, string>();
    lines.forEach((line: any, i: number) =>
      line.words?.forEach((w: any, j: number) => {
        map.set(`${i}-${j}`, phonesOf(w));
      })
    );
    return map;
  }, [lines]);

  // Utility: optionally strip plural S/Z from the tail phone
  function stripPluralSuffix(phones: string): string {
    const parts = phones.trim().split(/\s+/g);
    if (!parts.length) return "";
    const last = parts[parts.length - 1];
    if (last === "S" || last === "Z") parts.pop();
    return parts.join(" ");
  }

  // Compute rhyme/exact match set for a given anchor wordId
  function computeRhymeOrExactSet(anchorId: string): Set<string> {
    const out = new Set<string>();
    const rawSel = wordPhonesMap.get(anchorId) || "";
    const selPhones = ignorePlurals ? stripPluralSuffix(rawSel) : rawSel;

    if (exactMatches) {
      // exact phone match
      for (const [id, raw] of wordPhonesMap.entries()) {
        const cand = ignorePlurals ? stripPluralSuffix(raw) : raw;
        if (cand === selPhones) out.add(id);
      }
      return out;
    }

    // rhyme mode (compute even if showRhymes is off; UI will gate rendering)
    const rhymeMap = ignorePlurals
      ? new Map(
          Array.from(wordPhonesMap.entries()).map(([id, ph]) => [
            id,
            stripPluralSuffix(ph),
          ])
        )
      : wordPhonesMap;
    const rhymers = extractRhymingWords(selPhones, rhymeMap);
    for (const id of rhymers) out.add(id);
    return out;
  }

  // Compute alliteration set (first phone) for a given anchor wordId
  function computeAlliterationSet(anchorId: string): Set<string> {
    const out = new Set<string>();
    const selPhones = wordPhonesMap.get(anchorId) || "";
    const list = extractAlliterativeWords(selPhones, wordPhonesMap, {
      consonantsOnly: true,
    });
    for (const id of list) out.add(id);
    return out;
  }

  // Fast lookup: which active selections anchor a given word?
  const anchorsByWordId: Map<string, WordSelection[]> = useMemo(() => {
    const m = new Map<string, WordSelection[]>();
    for (const s of selections) {
      if (!s.active) continue;
      const arr = m.get(s.wordId) ?? [];
      arr.push(s);
      m.set(s.wordId, arr);
    }
    return m;
  }, [selections]);

  // Matches per selection (rhyme/exact), computed regardless of visibility toggles
  const matchesBySelectionId: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    for (const s of selections) {
      if (!s.active) continue;
      out[s.id] = computeRhymeOrExactSet(s.wordId);
    }
    return out;
  }, [selections, exactMatches, ignorePlurals, wordPhonesMap]);

  // Alliteration per selection (computed regardless of visibility toggle)
  const alliterationBySelectionId: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    for (const s of selections) {
      if (!s.active) continue;
      out[s.id] = computeAlliterationSet(s.wordId);
    }
    return out;
  }, [selections, wordPhonesMap]);

  // Z-order: last created = topmost
  const activeInZOrder = useMemo(
    () =>
      selections
        .filter((s) => s.active)
        .sort((a, b) => a.createdAt - b.createdAt),
    [selections]
  );

  // Decide what a given word should look like
  function getVisualForWord(wordId: string): VisualForWord {
    // 1) if this word is an anchor, show the topmost anchor color
    for (let i = activeInZOrder.length - 1; i >= 0; i--) {
      const s = activeInZOrder[i];
      if (s.wordId === wordId)
        return { role: "anchor", color: s.color, selectionId: s.id };
    }
    // 2) else if it matches any selection by rhyme/exact, show the topmost match color
    for (let i = activeInZOrder.length - 1; i >= 0; i--) {
      const s = activeInZOrder[i];
      const set = matchesBySelectionId[s.id];
      if (set?.has?.(wordId))
        return { role: "match", color: s.color, selectionId: s.id };
    }
    // 3) else if it matches alliteration, show the topmost alliteration color
    for (let i = activeInZOrder.length - 1; i >= 0; i--) {
      const s = activeInZOrder[i];
      const set = alliterationBySelectionId[s.id];
      if (set?.has?.(wordId))
        return { role: "alliteration", color: s.color, selectionId: s.id };
    }
    return null;
  }

  // ---- Mutators -------------------------------------------------------------

  function addSelection(
    wordId: string,
    opts?: { color?: string; label?: string }
  ) {
    const nextColor =
      opts?.color ??
      DEFAULT_PALETTE[selections.length % DEFAULT_PALETTE.length];
    const sel: WordSelection = {
      id: nanoid(),
      wordId,
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

  function updateSelection(id: string, patch: Partial<WordSelection>) {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  /**
   * Anchor collision-aware action (word-level):
   * - If the clicked word belongs to an existing selection's match/alliteration set,
   *   adopt that selection and repoint its anchor to the clicked word.
   * - Otherwise, create a new selection.
   * - Then dedupe: keep only one selection per matching *rhyme/exact* group.
   *   (Alliteration is a separate overlay and doesn't drive dedupe.)
   */
  function anchorOrAdopt(wordId: string) {
    setSelections((prev) => {
      // 1) find candidate to adopt: most recent active selection whose matches include the word
      let adopt: WordSelection | null = null;
      const withMatches: Array<{ s: WordSelection; matches: Set<string> }> = [];
      for (const s of prev) {
        if (!s.active) continue;
        const m = computeRhymeOrExactSet(s.wordId);
        withMatches.push({ s, matches: m });
        if (m.has(wordId) || s.wordId === wordId) {
          if (!adopt || s.createdAt > adopt.createdAt) adopt = s;
        }
      }

      // 2) update adopted selection or create new one
      let next = [...prev];
      if (adopt) {
        next = next.map((s) => (s.id === adopt!.id ? { ...s, wordId } : s));
      } else {
        const nextColor = DEFAULT_PALETTE[next.length % DEFAULT_PALETTE.length];
        next = [
          ...next,
          {
            id: nanoid(),
            wordId,
            color: nextColor,
            active: true,
            createdAt: Date.now(),
          } as WordSelection,
        ];
      }

      // 3) Dedupe within rhyme/exact group
      const adoptedId = adopt ? adopt.id : next[next.length - 1].id;
      const adopted = next.find((s) => s.id === adoptedId)!;
      const adoptedSet = computeRhymeOrExactSet(adopted.wordId);

      next = next.filter((s) => {
        if (s.id === adoptedId) return true;
        const sSet = computeRhymeOrExactSet(s.wordId);
        const sameGroup = adoptedSet.has(s.wordId) || sSet.has(adopted.wordId);
        return !sameGroup;
      });

      return next;
    });
  }

  // (Optional) legacy compat: expose "selectedWordId" as the last active selection's anchor
  const selectedWordId = activeInZOrder.length
    ? activeInZOrder[activeInZOrder.length - 1].wordId
    : null;

  return (
    <WordSelectionContext.Provider
      value={{
        // data
        selections,
        anchorsByWordId,
        matchesBySelectionId, // rhyme/exact sets
        alliterationBySelectionId, // alliteration sets
        // helpers
        getVisualForWord,
        // mutators
        addSelection,
        anchorOrAdopt,
        removeSelection,
        clearSelections,
        toggleSelectionActive,
        setSelectionColor,
        updateSelection,
        // legacy
        selectedWordId,
      }}
    >
      {children}
    </WordSelectionContext.Provider>
  );
}

export function useWordSelection() {
  return useContext(WordSelectionContext);
}
