// src/contexts/lyricsContexts/WordSelectionContext.jsx
import React, { createContext, useContext, useState, useMemo } from "react";
import { useParams } from "../ParamsContext";
import { extractRhymingWords } from "../../utils/extractRhymingWords";
import { extractAlliterativeWords } from "../../utils/extractAlliterations";

const WordSelectionContext = createContext();

export function WordSelectionProvider({ transcriptionData, children }) {
  // The single word the user clicked on (or `null`)
  const [selectedWordId, setSelectedWordId] = useState(null);

  // ── pull in your visual & logical parameters ──
  const { exactMatches, ignorePlurals /*, alliterationMode */ } = useParams();

  // Toggle selection on/off
  const toggleWord = (wordId) =>
    setSelectedWordId((prev) => (prev === wordId ? null : wordId));

  // Keep an array so `.includes(...)` is always safe
  const selectedWordIds = useMemo(
    () => (selectedWordId ? [selectedWordId] : []),
    [selectedWordId]
  );

  // Build a map from each word to its *first* phones string
  const wordPhonesMap = useMemo(() => {
    const map = new Map();
    transcriptionData.lines.forEach((line, i) =>
      line.words?.forEach((w, j) => {
        const id = `${i}-${j}`;
        const phonesStr = Array.isArray(w.phones)
          ? w.phones[0]
          : String(w.phones || "");
        map.set(id, phonesStr);
      })
    );
    return map;
  }, [transcriptionData]);

  // Build our rhyming map (same content as wordPhonesMap; kept for clarity)
  const wordRhymesMap = useMemo(() => {
    const m = new Map();
    transcriptionData.lines.forEach((line, i) => {
      line.words?.forEach((w, j) => {
        const id = `${i}-${j}`;
        const phonesStr = Array.isArray(w.phones)
          ? w.phones[0]
          : String(w.phones || "");
        m.set(id, phonesStr);
      });
    });
    return m;
  }, [transcriptionData]);

  // helper to strip trailing ARPAbet 'S' phone
  const stripPluralSuffix = (phones) => {
    const parts = phones.split(" ");
    if (parts[parts.length - 1] === "S" || parts[parts.length - 1] === "Z")
      parts.pop();
    return parts.join(" ");
  };

  // Find all IDs matching either *exact* phones or *rhyming* phones
  const matchedWordIds = useMemo(() => {
    if (!selectedWordId) return new Set();

    if (exactMatches) {
      // ── exact match mode ──
      const rawSel = wordPhonesMap.get(selectedWordId) || "";
      const selPhones = ignorePlurals ? stripPluralSuffix(rawSel) : rawSel;

      const result = new Set();
      for (let [id, rawPhones] of wordPhonesMap.entries()) {
        const candidate = ignorePlurals
          ? stripPluralSuffix(rawPhones)
          : rawPhones;
        if (candidate === selPhones) {
          result.add(id);
        }
      }
      return result;
    } else {
      // ── rhyming mode ──
      let raw = wordRhymesMap.get(selectedWordId) || "";
      const keyPhones = ignorePlurals ? stripPluralSuffix(raw) : raw;

      const rhymeMap = ignorePlurals
        ? new Map(
            Array.from(wordRhymesMap.entries()).map(([id, ph]) => [
              id,
              stripPluralSuffix(ph),
            ])
          )
        : wordRhymesMap;

      const rhymers = extractRhymingWords(keyPhones, rhymeMap);
      return new Set(rhymers);
    }
  }, [
    selectedWordId,
    wordPhonesMap,
    wordRhymesMap,
    exactMatches,
    ignorePlurals,
  ]);

  // NEW: Alliteration — matching the *first phone*
  // (You can later replace the hard-coded option with a param flag.)
  const alliterationMatchedWordIds = useMemo(() => {
    if (!selectedWordId) return new Set();
    const selPhones = wordPhonesMap.get(selectedWordId) || "";
    // Example option: only match on consonants (common alliteration notion)
    const list = extractAlliterativeWords(selPhones, wordPhonesMap, {
      consonantsOnly: true,
    });
    return new Set(list);
  }, [selectedWordId, wordPhonesMap]);

  return (
    <WordSelectionContext.Provider
      value={{
        selectedWordId,
        selectedWordIds,
        matchedWordIds, // rhyme/exact matches (existing)
        alliterationMatchedWordIds, // NEW: initial-phone matches
        toggleWord,
      }}
    >
      {children}
    </WordSelectionContext.Provider>
  );
}

export function useWordSelection() {
  return useContext(WordSelectionContext);
}
