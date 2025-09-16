// src/contexts/lyricsContexts/LineSelectionContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { useParams } from "../ParamsContext";
import { extractLines, getMatchingLinesFor } from "../../utils/extractLines";

const LineSelectionContext = createContext();

export function LineSelectionProvider({ transcriptionData, children }) {
  const [selectedLineIdx, setSelectedLineIdx] = useState(null);

  // Visual / logical params that influence matching
  const { exactMatches, ignorePlurals } = useParams();

  // Precompute line endings, rhyme keys, and indices
  const extracted = useMemo(() => {
    return extractLines(transcriptionData, { ignorePlurals });
  }, [transcriptionData, ignorePlurals]);

  // Lines matching the selected one (by exact phones or rhyme key)
  const matchedLineIdxs = useMemo(() => {
    if (selectedLineIdx == null) return new Set();
    return getMatchingLinesFor(extracted, selectedLineIdx, { exactMatches });
  }, [extracted, selectedLineIdx, exactMatches]);

  const toggleLine = (lineIdx) =>
    setSelectedLineIdx((prev) => (prev === lineIdx ? null : lineIdx));

  return (
    <LineSelectionContext.Provider
      value={{
        selectedLineIdx,
        toggleLine,
        matchedLineIdxs,
        // optional exposers for debugging / features:
        // extracted, // { lines, rhymeIndex, exactIndex }
      }}
    >
      {children}
    </LineSelectionContext.Provider>
  );
}

export function useLineSelection() {
  return useContext(LineSelectionContext);
}
