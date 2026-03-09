// src/contexts/lyricsContexts/SyllableSelectionContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";

import { useParams } from "../ParamsContext";
import { extractVowels } from "../../utils/extractVowels";
import { VOWEL_SIM, getThreshold } from "../../utils/phonemeSimilarity.js";

const SyllableSelectionContext = createContext(null);

function colorToHue(color) {
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
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return Math.round(h * 360);
  }
  return null;
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

function generateDistinctColor(existingColors) {
  const existingHues = existingColors.map(colorToHue).filter((h) => h !== null);
  const gap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  for (let i = 0; i < 40; i++) {
    const hue = Math.floor(Math.random() * 360);
    if (existingHues.every((eh) => gap(hue, eh) >= 35)) return hslToHex(hue, 78, 52);
  }
  let bestHue = 0, bestMin = -1;
  for (let h = 0; h < 360; h += 3) {
    const minD = existingHues.length === 0 ? 180 : Math.min(...existingHues.map((eh) => gap(h, eh)));
    if (minD > bestMin) { bestMin = minD; bestHue = h; }
  }
  return hslToHex(bestHue, 78, 52);
}

/* ------------------ Helpers ------------------ */

function buildFlatSyllables(transcriptionData) {
  const flat = [];
  const lines = transcriptionData?.lines ?? [];

  lines.forEach((line, li) => {
    (line.words ?? []).forEach((word, wi) => {
      const nSyllables = word.nSyllables ?? 1;
      const phonesList = Array.isArray(word.phones) ? word.phones : [];

      const candSets = Array.from({ length: nSyllables }, () => new Set());

      for (const pron of phonesList) {
        const vowels = extractVowels(pron) ?? [];
        for (let si = 0; si < nSyllables; si++) {
          const v = vowels[si];
          if (v) candSets[si].add(v);
        }
      }

      for (let si = 0; si < nSyllables; si++) {
        if (candSets[si].size === 0) candSets[si].add("AH");
      }

      for (let si = 0; si < nSyllables; si++) {
        const id = `${li}-${wi}-${si}`;
        const candidates = Array.from(candSets[si]);
        const start = typeof word.start === "number" ? word.start : Number.NaN;

        flat.push({ id, li, wi, si, start, candidates });
      }
    });
  });

  flat.sort((a, b) => {
    const ta = Number.isFinite(a.start) ? a.start : Infinity;
    const tb = Number.isFinite(b.start) ? b.start : Infinity;
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });

  return flat;
}

function sliceRangeByIds(flat, idA, idB) {
  const startIdx = flat.findIndex((s) => s.id === idA);
  const endIdx = flat.findIndex((s) => s.id === idB);
  if (startIdx < 0 || endIdx < 0) return [];
  const [a, b] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
  return flat.slice(a, b + 1);
}

function makeId() {
  return `sel_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

/* ------------------ Matching ------------------ */

function computeMatchesForSelection({
  selection,
  flat,
  wildcardSkips,
  minMatchLen,
  syllableThreshold,
}) {
  // Build query vowel sequence using first candidate per syllable (default pick)
  const chosenSeq = selection.syllableIds
    .map((id) => {
      const chosen = selection.chosenById?.[id];
      if (chosen) return chosen;
      const s = selection.candidatesById?.[id];
      if (Array.isArray(s) && s.length) return s[0];
      return null;
    })
    .filter(Boolean);

  if (chosenSeq.length < minMatchLen) return new Set();

  // All contiguous subsets of the query
  const subsets = [];
  for (let s = 0; s < chosenSeq.length; s++) {
    for (let e = s + minMatchLen; e <= chosenSeq.length; e++) {
      subsets.push(chosenSeq.slice(s, e));
    }
  }

  const matches = new Set();

  // Target side uses union matching (any candidate vowel can match)
  const flatVowels = flat.map((s) => ({ id: s.id, candidates: s.candidates }));

  subsets.forEach((pattern) => {
    for (let i = 0; i < flatVowels.length; i++) {
      let pi = 0;
      let skips = 0;
      const ids = [];

      for (let j = i; j < flatVowels.length && pi < pattern.length; j++) {
        const ok = flatVowels[j].candidates.some(
          (c) => (VOWEL_SIM[c]?.[pattern[pi]] ?? 0) >= syllableThreshold
        );
        if (ok) {
          ids.push(flatVowels[j].id);
          pi++;
        } else {
          skips++;
          if (skips > wildcardSkips) break;
        }
      }

      if (pi === pattern.length) {
        ids.forEach((id) => matches.add(id));
      }
    }
  });

  return matches;
}

/* ------------------ Provider ------------------ */

export function SyllableSelectionProvider({ children, transcriptionData }) {
  const { wildcardSkips, minMatchLen, vowelColors, syllableStrictness } = useParams();

  const [selections, setSelections] = useState([]);

  // Two-click draft state: first click sets anchor, second click commits
  const [draft, setDraft] = useState({ anchorId: null });

  const flat = useMemo(() => buildFlatSyllables(transcriptionData), [transcriptionData]);

  const flatById = useMemo(() => {
    const m = new Map();
    flat.forEach((s) => m.set(s.id, s));
    return m;
  }, [flat]);

  // Highlight just the anchor syllable while waiting for second click
  const draftRangeIds = useMemo(
    () => (draft.anchorId ? [draft.anchorId] : []),
    [draft.anchorId]
  );

  // Second click: auto-commit immediately, no modal
  const handleSyllableClick = useCallback(
    (id) => {
      if (!draft.anchorId) {
        // First click — set anchor
        setDraft({ anchorId: id });
        return;
      }

      if (draft.anchorId === id) {
        // Clicked same syllable twice — cancel the draft
        setDraft({ anchorId: null });
        return;
      }

      // Second click — commit immediately with default vowel choices
      const anchorId = draft.anchorId;
      const slice = sliceRangeByIds(flat, anchorId, id);
      const rangeIds = slice.map((s) => s.id);

      const candidatesById = {};
      const chosenById = {};
      rangeIds.forEach((sid) => {
        const s = flatById.get(sid);
        const cands =
          Array.isArray(s?.candidates) && s.candidates.length
            ? s.candidates
            : ["AH"];
        candidatesById[sid] = cands;
        chosenById[sid] = cands[0];
      });

      setSelections((prev) => {
        const color = generateDistinctColor(prev.map((s) => s.color));
        const newSel = {
          id: makeId(),
          active: true,
          color,
          label: "",
          syllableIds: rangeIds,
          candidatesById,
          chosenById,
        };
        return [newSel, ...prev];
      });

      setDraft({ anchorId: null });
    },
    [draft.anchorId, flat, flatById]
  );

  const cancelDraft = useCallback(() => {
    setDraft({ anchorId: null });
  }, []);

  // Selection management
  const removeSelection = useCallback((id) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const toggleSelectionActive = useCallback((id) => {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  }, []);

  const updateSelection = useCallback((id, patch) => {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }, []);

  const setSelectionColor = useCallback((id, color) => {
    setSelections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color } : s))
    );
  }, []);

  // Union of syllable IDs across all committed selections + current draft anchor
  const selectedIds = useMemo(() => {
    const out = new Set();
    (selections ?? []).forEach((s) => {
      s.syllableIds?.forEach((id) => out.add(id));
    });
    draftRangeIds.forEach((id) => out.add(id));
    return Array.from(out);
  }, [selections, draftRangeIds]);

  // Match computation per active selection
  const matchesBySelectionId = useMemo(() => {
    const syllableThreshold = getThreshold(syllableStrictness, "syllable");
    const rec = {};
    (selections ?? []).forEach((sel) => {
      if (!sel.active) {
        rec[sel.id] = new Set();
        return;
      }
      rec[sel.id] = computeMatchesForSelection({
        selection: sel,
        flat,
        wildcardSkips,
        minMatchLen,
        syllableThreshold,
      });
    });
    return rec;
  }, [selections, flat, wildcardSkips, minMatchLen, syllableStrictness]);

  const matchedIds = useMemo(() => {
    const out = new Set();
    Object.values(matchesBySelectionId).forEach((set) => {
      if (!set) return;
      set.forEach((id) => out.add(id));
    });
    return out;
  }, [matchesBySelectionId]);


  return (
    <SyllableSelectionContext.Provider
      value={{
        selections,
        matchedIds,
        selectedIds,
        vowelColors,
        draft,
        draftRangeIds,
        handleSyllableClick,
        cancelDraft,
        removeSelection,
        toggleSelectionActive,
        updateSelection,
        setSelectionColor,
        matchesBySelectionId,
      }}
    >
      {children}
    </SyllableSelectionContext.Provider>
  );
}

export function useSyllableSelection() {
  return useContext(SyllableSelectionContext);
}
