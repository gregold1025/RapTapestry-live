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

  // Always compute matches for the currently selected line.
  // Rendering layers will decide whether to display them.
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
        matchedLineIdxs, // always computed
        // extracted, // expose for debugging if useful
      }}
    >
      {children}
    </LineSelectionContext.Provider>
  );
}

export function useLineSelection() {
  return useContext(LineSelectionContext);
}
