// src/contexts/WordSelectionContext.jsx
import React, { createContext, useContext, useState, useMemo } from "react";
import { extractRhymingWords } from "../utils/extractRhymingWords";

const WordSelectionContext = createContext();

export function WordSelectionProvider({ transcriptionData, children }) {
  // The single word the user clicked on (or `null`)
  const [selectedWordId, setSelectedWordId] = useState(null);

  // Toggle selection on/off
  const toggleWord = (wordId) =>
    setSelectedWordId((prev) => (prev === wordId ? null : wordId));

  // Keep an array so `.includes(...)` is always safe
  const selectedWordIds = useMemo(
    () => (selectedWordId ? [selectedWordId] : []),
    [selectedWordId]
  );

  /*   // Build a map: "lineIdx-wordIdx" → phones string
  const wordPhonesMap = useMemo(() => {
    const map = new Map();
    transcriptionData.lines.forEach((line, lineIdx) => {
      line.words?.forEach((word, wordIdx) => {
        const id = `${lineIdx}-${wordIdx}`;
        const phonesStr = Array.isArray(word.phones)
          ? word.phones.join(" ")
          : String(word.phones || "");
        map.set(id, phonesStr);
      });
    });
    return map;
  }, [transcriptionData]);

  // Find all IDs whose phones === the selected word’s phones
  const matchedWordIds = useMemo(() => {
    if (!selectedWordId) return new Set();
    const selectedPhones = wordPhonesMap.get(selectedWordId);
    if (!selectedPhones) return new Set();

    const result = new Set();
    for (let [id, phones] of wordPhonesMap.entries()) {
      if (phones === selectedPhones) result.add(id);
    }
    return result;
  }, [wordPhonesMap, selectedWordId]); */

  const wordRhymesMap = useMemo(() => {
    // Map<id, phonesStr>
    const m = new Map();
    transcriptionData.lines.forEach((line, i) => {
      line.words?.forEach((w, j) => {
        const id = `${i}-${j}`;
        // pick your canonical phones string
        const phonesStr = Array.isArray(w.phones)
          ? w.phones[0]
          : String(w.phones || "");
        m.set(id, phonesStr);
      });
    });
    return m;
  }, [transcriptionData]);

  const matchedWordIds = useMemo(() => {
    if (!selectedWordId) return new Set();
    // find all ids that rhyme with the selected word
    const phonesStr = wordRhymesMap.get(selectedWordId);
    const rhymers = extractRhymingWords(phonesStr, wordRhymesMap);
    return new Set(rhymers);
  }, [selectedWordId, wordRhymesMap]);

  return (
    <WordSelectionContext.Provider
      value={{
        selectedWordId,
        selectedWordIds,
        matchedWordIds,
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
