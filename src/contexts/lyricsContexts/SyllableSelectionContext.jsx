import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import { useParams } from "../ParamsContext";
import { extractVowels } from "../../utils/extractVowels";

const SyllableSelectionContext = createContext();

export function SyllableSelectionProvider({ children, transcriptionData }) {
  const [clickedSyllables, setClickedSyllables] = useState([]);

  const { wildcardSkips, minMatchLen, vowelColors } = useParams();

  const handleSyllableClick = (id, vowel) => {
    setClickedSyllables((prev) => [...prev, { id, vowel }].slice(-2));
  };

  const selectedIds = useMemo(
    () => clickedSyllables.map((s) => s.id),
    [clickedSyllables]
  );

  const selectedVowels = useMemo(() => {
    if (clickedSyllables.length < 2) return [];

    const flat = [];
    transcriptionData.lines.forEach((line, li) =>
      line.words?.forEach((word, wi) =>
        extractVowels(word.phones?.[0]).forEach((v, si) =>
          flat.push({ id: `${li}-${wi}-${si}`, vowel: v })
        )
      )
    );

    const start = flat.findIndex((s) => s.id === clickedSyllables[0].id);
    const end = flat.findIndex((s) => s.id === clickedSyllables[1].id);
    if (start < 0 || end < 0) return [];

    const [a, b] = start < end ? [start, end] : [end, start];
    return flat.slice(a, b + 1).map((s) => s.vowel);
  }, [clickedSyllables, transcriptionData]);

  const matchedIds = useMemo(() => {
    if (selectedVowels.length < minMatchLen) return new Set();

    const flat = [];
    transcriptionData.lines.forEach((line, li) =>
      line.words?.forEach((word, wi) =>
        extractVowels(word.phones?.[0]).forEach((v, si) =>
          flat.push({ id: `${li}-${wi}-${si}`, vowel: v })
        )
      )
    );

    const subsets = [];
    for (let s = 0; s < selectedVowels.length; s++) {
      for (let e = s + minMatchLen; e <= selectedVowels.length; e++) {
        subsets.push(selectedVowels.slice(s, e));
      }
    }

    const matches = new Set();
    subsets.forEach((pattern) => {
      for (let i = 0; i < flat.length; i++) {
        let pi = 0,
          skips = 0,
          ids = [];
        for (let j = i; j < flat.length && pi < pattern.length; j++) {
          if (flat[j].vowel === pattern[pi]) {
            ids.push(flat[j].id);
            pi++;
          } else {
            skips++;
            if (skips > wildcardSkips) break;
          }
        }
        if (pi === pattern.length) ids.forEach((id) => matches.add(id));
      }
    });

    return matches;
  }, [selectedVowels, wildcardSkips, minMatchLen, transcriptionData]);

  useEffect(() => {
    if (matchedIds.size > 0) {
      console.log("✅ matchedIds recomputed:", [...matchedIds]);
    }
  }, [matchedIds]);

  return (
    <SyllableSelectionContext.Provider
      value={{
        clickedSyllables,
        handleSyllableClick,
        selectedIds,
        selectedVowels,
        matchedIds,
        vowelColors,
      }}
    >
      {children}
    </SyllableSelectionContext.Provider>
  );
}

export function useSyllableSelection() {
  return useContext(SyllableSelectionContext);
}
