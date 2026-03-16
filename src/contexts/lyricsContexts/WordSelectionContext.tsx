// src/contexts/lyricsContexts/WordSelectionContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { useParams } from "../ParamsContext";
import { extractRhymingWords } from "../../utils/extractRhymingWords";
import { extractAlliterativeWords } from "../../utils/extractAlliterations";
import { extractConsonantWords } from "../../utils/extractConsonance";
import {
  getThreshold,
  getCodaThreshold,
  rhymeGate,
  rhymeComponents,
  assonanceScore,
  alliterationScore,
  consonanceScore,
} from "../../utils/phonemeSimilarity.js";
import { generateDistinctColor } from "../../utils/selectionColors.js";
import { nextStamp } from "../../utils/interactionCounter.js";

// ---- Types ------------------------------------------------------------------

export type SelectionParams = Partial<{
  showRhymes: boolean;
  rhymeStrictness: number;
  rhymeSearchDistance: number;
  codaTolerance: number;
  exactMatches: boolean;
  ignorePlurals: boolean;
  alliterationTier: string;
  alliterationSearchDistance: number;
  showAssonance: boolean;
  assonanceStrictness: number;
  assonanceSearchDistance: number;
  showConsonance: boolean;
  consonanceStrictness: number;
  consonanceSearchDistance: number;
}>;

type ResolvedParams = Required<SelectionParams>;

type WordSelection = {
  id: string;
  wordId: string;
  color: string;
  label?: string;
  active: boolean;
  createdAt: number;
  params?: SelectionParams;
};

/**
 * All applicable match types for a word are returned simultaneously so
 * renderers can stack decorations (fill + underline + outline together).
 */
type VisualForWord = {
  color: string;
  selectionId: string;
  score: number;
  roles: {
    isAnchor: boolean;
    isRhyme: boolean;
    isAlliteration: boolean;
    isAssonance: boolean;
    isConsonance: boolean;
  };
} | null;

const WordSelectionContext = createContext<any>(null);

// ---- Helpers ----------------------------------------------------------------

function lineIdxOf(wordId: string): number {
  return parseInt(wordId.split("-")[0], 10);
}

function phonesOf(word: any): string {
  if (!word) return "";
  const ph = Array.isArray(word.phones) ? word.phones[0] : word.phones || "";
  return String(ph || "");
}

function stripPluralSuffix(phones: string): string {
  const parts = phones.trim().split(/\s+/g);
  if (!parts.length) return "";
  const last = parts[parts.length - 1];
  if (last === "S" || last === "Z") parts.pop();
  return parts.join(" ");
}

function inRange(anchorId: string, candidateId: string, maxLines: number): boolean {
  return Math.abs(lineIdxOf(candidateId) - lineIdxOf(anchorId)) <= maxLines;
}

// ---- Provider ---------------------------------------------------------------

export function WordSelectionProvider({
  transcriptionData,
  children,
}: {
  transcriptionData: any;
  children: React.ReactNode;
}) {
  const [selections, setSelections] = useState<WordSelection[]>([]);

  const {
    showRhymes,
    exactMatches,
    ignorePlurals,
    rhymeStrictness,
    rhymeSearchDistance,
    codaTolerance,
    alliterationTier,
    alliterationSearchDistance,
    showAssonance,
    assonanceStrictness,
    assonanceSearchDistance,
    showConsonance,
    consonanceStrictness,
    consonanceSearchDistance,
  } = useParams();

  const lines = transcriptionData?.lines ?? [];

  const wordPhonesMap: Map<string, string> = useMemo(() => {
    const map = new Map<string, string>();
    lines.forEach((line: any, i: number) =>
      line.words?.forEach((w: any, j: number) => {
        map.set(`${i}-${j}`, phonesOf(w));
      })
    );
    return map;
  }, [lines]);

  // Merge per-selection params with global fallbacks
  function resolveParams(sel: WordSelection): ResolvedParams {
    const p = sel.params ?? {};
    return {
      showRhymes:                  p.showRhymes              ?? showRhymes,
      rhymeStrictness:             p.rhymeStrictness         ?? rhymeStrictness,
      rhymeSearchDistance:         p.rhymeSearchDistance     ?? rhymeSearchDistance,
      codaTolerance:               p.codaTolerance           ?? codaTolerance,
      exactMatches:                p.exactMatches            ?? exactMatches,
      ignorePlurals:               p.ignorePlurals           ?? ignorePlurals,
      alliterationTier:            p.alliterationTier        ?? alliterationTier,
      alliterationSearchDistance:  p.alliterationSearchDistance ?? alliterationSearchDistance,
      showAssonance:               p.showAssonance           ?? showAssonance,
      assonanceStrictness:         p.assonanceStrictness     ?? assonanceStrictness,
      assonanceSearchDistance:     p.assonanceSearchDistance ?? assonanceSearchDistance,
      showConsonance:              p.showConsonance          ?? showConsonance,
      consonanceStrictness:        p.consonanceStrictness    ?? consonanceStrictness,
      consonanceSearchDistance:    p.consonanceSearchDistance ?? consonanceSearchDistance,
    };
  }

  // ---- Compute functions (accept explicit resolved params) ------------------

  /** Returns a Map of wordId → quality (0-1) for all rhyme matches. */
  function computeRhymeOrExactSet(anchorId: string, p: ResolvedParams): Map<string, number> {
    if (!p.showRhymes) return new Map();
    const out = new Map<string, number>();
    const rawSel = wordPhonesMap.get(anchorId) || "";
    const selPhones = p.ignorePlurals ? stripPluralSuffix(rawSel) : rawSel;

    if (p.exactMatches) {
      for (const [id, raw] of wordPhonesMap.entries()) {
        if (!inRange(anchorId, id, p.rhymeSearchDistance)) continue;
        const cand = p.ignorePlurals ? stripPluralSuffix(raw) : raw;
        if (cand === selPhones) out.set(id, 1.0);
      }
      return out;
    }

    const rhymeMap = p.ignorePlurals
      ? new Map(Array.from(wordPhonesMap.entries()).map(([id, ph]) => [id, stripPluralSuffix(ph)]))
      : wordPhonesMap;
    const nucleusThreshold = getThreshold(p.rhymeStrictness, "rhyme");
    const codaThreshold = getCodaThreshold(nucleusThreshold, p.codaTolerance);
    for (const { id, quality } of extractRhymingWords(selPhones, rhymeMap, nucleusThreshold, codaThreshold)) {
      if (inRange(anchorId, id, p.rhymeSearchDistance)) out.set(id, quality);
    }
    return out;
  }

  function computeAlliterationSet(anchorId: string, p: ResolvedParams): Set<string> {
    if (p.alliterationTier === "off") return new Set();
    const selPhones = wordPhonesMap.get(anchorId) || "";
    const list = extractAlliterativeWords(selPhones, wordPhonesMap, { tier: p.alliterationTier });
    return new Set(list.filter((id: string) => inRange(anchorId, id, p.alliterationSearchDistance)));
  }

  function computeAssonanceSet(anchorId: string, p: ResolvedParams): Set<string> {
    if (!p.showAssonance) return new Set();
    const out = new Set<string>();
    const selPhones = wordPhonesMap.get(anchorId) || "";
    const threshold = getThreshold(p.assonanceStrictness, "assonance");
    for (const [id, phones] of wordPhonesMap.entries()) {
      if (!inRange(anchorId, id, p.assonanceSearchDistance)) continue;
      if (assonanceScore(selPhones, phones) >= threshold) out.add(id);
    }
    return out;
  }

  function computeConsonanceSet(anchorId: string, p: ResolvedParams): Set<string> {
    if (!p.showConsonance) return new Set();
    const selPhones = wordPhonesMap.get(anchorId) || "";
    const threshold = getThreshold(p.consonanceStrictness, "consonance");
    const all = extractConsonantWords(selPhones, wordPhonesMap, threshold);
    return new Set(all.filter((id: string) => inRange(anchorId, id, p.consonanceSearchDistance)));
  }

  // ---- Memos ----------------------------------------------------------------
  // deps include global params (fallback) + selections (which carries per-sel params)

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

  const matchesBySelectionId: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    for (const s of selections) {
      if (!s.active) { out[s.id] = new Set(); continue; }
      out[s.id] = computeRhymeOrExactSet(s.wordId, resolveParams(s));
    }
    return out;
  }, [selections, wordPhonesMap, showRhymes, exactMatches, ignorePlurals, rhymeStrictness, rhymeSearchDistance, codaTolerance]);

  const alliterationBySelectionId: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    for (const s of selections) {
      if (!s.active) { out[s.id] = new Set(); continue; }
      out[s.id] = computeAlliterationSet(s.wordId, resolveParams(s));
    }
    return out;
  }, [selections, wordPhonesMap, alliterationTier, alliterationSearchDistance]);

  const assonanceBySelectionId: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    for (const s of selections) {
      if (!s.active) { out[s.id] = new Set(); continue; }
      out[s.id] = computeAssonanceSet(s.wordId, resolveParams(s));
    }
    return out;
  }, [selections, wordPhonesMap, showAssonance, assonanceStrictness, assonanceSearchDistance]);

  // Consonance disabled: definition ambiguous (matches throughout word, not coda-only)
  const consonanceBySelectionId: Record<string, Set<string>> = useMemo(() => {
    const out: Record<string, Set<string>> = {};
    for (const s of selections) { out[s.id] = new Set(); }
    return out;
  }, [selections]);

  const activeInZOrder = useMemo(
    () => selections.filter((s) => s.active).sort((a, b) => a.createdAt - b.createdAt),
    [selections]
  );

  const [manualFocusWordId, setManualFocusWordId] = useState<string | null>(null);
  const [wordInteractionStamp, setWordInteractionStamp] = useState<number>(0);

  const focusedWordSelId: string | null = useMemo(() => {
    if (manualFocusWordId && selections.some((s) => s.id === manualFocusWordId))
      return manualFocusWordId;
    return activeInZOrder.length ? activeInZOrder[activeInZOrder.length - 1].id : null;
  }, [manualFocusWordId, selections, activeInZOrder]);

  // ---- Visual map (pre-computed, O(1) at render time) -----------------------

  const visualByWordId: Map<string, VisualForWord> = useMemo(() => {
    const rev = [...activeInZOrder].reverse();
    const map = new Map<string, VisualForWord>();

    for (const [wordId, wordPhones] of wordPhonesMap) {
      const isAnchor       = activeInZOrder.some((s) => s.wordId === wordId);
      const isRhyme        = !isAnchor && activeInZOrder.some((s) => matchesBySelectionId[s.id]?.has(wordId));
      const isAlliteration = !isAnchor && activeInZOrder.some((s) => alliterationBySelectionId[s.id]?.has(wordId));
      const isAssonance    = !isAnchor && activeInZOrder.some((s) => assonanceBySelectionId[s.id]?.has(wordId));

      if (!isAnchor && !isRhyme && !isAlliteration && !isAssonance) continue;

      let color = "", selectionId = "", score = 0;

      if (isAnchor) {
        const s = rev.find((s) => s.wordId === wordId)!;
        color = s.color; selectionId = s.id; score = 1;
      } else if (isRhyme) {
        const s = rev.find((s) => matchesBySelectionId[s.id]?.has(wordId))!;
        color = s.color; selectionId = s.id;
        score = matchesBySelectionId[s.id]?.get(wordId) ?? 0;
      } else if (isAlliteration) {
        const s = rev.find((s) => alliterationBySelectionId[s.id]?.has(wordId))!;
        color = s.color; selectionId = s.id;
        score = alliterationScore(wordPhonesMap.get(s.wordId) || "", wordPhones);
      } else {
        const s = rev.find((s) => assonanceBySelectionId[s.id]?.has(wordId))!;
        color = s.color; selectionId = s.id;
        score = assonanceScore(wordPhonesMap.get(s.wordId) || "", wordPhones);
      }

      map.set(wordId, {
        color, selectionId, score,
        roles: { isAnchor, isRhyme, isAlliteration, isAssonance, isConsonance: false },
      });
    }
    return map;
  }, [activeInZOrder, matchesBySelectionId, alliterationBySelectionId, assonanceBySelectionId, wordPhonesMap]);

  function getVisualForWord(wordId: string): VisualForWord {
    return visualByWordId.get(wordId) ?? null;
  }

  // Most recently active anchor's phones string — used by diagrams in LyricPresets
  const latestAnchorPhones = useMemo(() => {
    if (!activeInZOrder.length) return null;
    return wordPhonesMap.get(activeInZOrder[activeInZOrder.length - 1].wordId) ?? null;
  }, [activeInZOrder, wordPhonesMap]);

  // ---- Mutators -------------------------------------------------------------

  function addSelection(wordId: string, opts?: { color?: string; label?: string }) {
    const nextColor = opts?.color ?? generateDistinctColor(selections.map((s) => s.color));
    const sel: WordSelection = {
      id: nanoid(), wordId, color: nextColor, label: opts?.label,
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
    setSelections((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }

  function setSelectionColor(id: string, color: string) {
    setSelections((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
  }

  function updateSelection(id: string, patch: Partial<WordSelection>) {
    setSelections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function setSelectionParams(id: string, patch: SelectionParams) {
    setSelections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, params: { ...(s.params ?? {}), ...patch } } : s
      )
    );
  }

  function clearSelectionParams(id: string) {
    setSelections((prev) => prev.map((s) => (s.id === id ? { ...s, params: {} } : s)));
  }

  function markWordInteraction() {
    setWordInteractionStamp(nextStamp());
  }

  function anchorOrAdopt(wordId: string) {
    setManualFocusWordId(null);
    setWordInteractionStamp(nextStamp());
    setSelections((prev) => {
      let adopt: WordSelection | null = null;
      for (const s of prev) {
        if (!s.active) continue;
        const p = resolveParams(s);
        const m = computeRhymeOrExactSet(s.wordId, p);
        if (m.has(wordId) || s.wordId === wordId) {
          if (!adopt || s.createdAt > adopt.createdAt) adopt = s;
        }
      }

      let next = [...prev];
      if (adopt) {
        next = next.map((s) => (s.id === adopt!.id ? { ...s, wordId } : s));
      } else {
        const nextColor = generateDistinctColor(next.map((s) => s.color));
        next = [...next, { id: nanoid(), wordId, color: nextColor, active: true, createdAt: Date.now() } as WordSelection];
      }

      const adoptedId = adopt ? adopt.id : next[next.length - 1].id;
      const adopted = next.find((s) => s.id === adoptedId)!;
      const adoptedP = resolveParams(adopted);
      const adoptedSet = computeRhymeOrExactSet(adopted.wordId, adoptedP);

      next = next.filter((s) => {
        if (s.id === adoptedId) return true;
        const sP = resolveParams(s);
        const sSet = computeRhymeOrExactSet(s.wordId, sP);
        return !(adoptedSet.has(s.wordId) || sSet.has(adopted.wordId));
      });

      return next;
    });
  }

  const selectedWordId = activeInZOrder.length
    ? activeInZOrder[activeInZOrder.length - 1].wordId
    : null;

  return (
    <WordSelectionContext.Provider
      value={{
        selections, anchorsByWordId,
        matchesBySelectionId,
        alliterationBySelectionId,
        assonanceBySelectionId,
        consonanceBySelectionId,
        visualByWordId,
        getVisualForWord,
        latestAnchorPhones,
        addSelection, anchorOrAdopt, removeSelection, clearSelections,
        toggleSelectionActive, setSelectionColor, updateSelection,
        setSelectionParams, clearSelectionParams,
        markWordInteraction,
        selectedWordId,
        focusedWordSelId,
        setFocusedWordSelId: (id: string | null) => {
          setManualFocusWordId(id);
          if (id) setWordInteractionStamp(nextStamp());
        },
        wordInteractionStamp,
      }}
    >
      {children}
    </WordSelectionContext.Provider>
  );
}

export function useWordSelection() {
  return useContext(WordSelectionContext);
}
