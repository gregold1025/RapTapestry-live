// src/contexts/LineSelectionContext.jsx
import { createContext, useContext, useState } from "react";

const LineSelectionContext = createContext();

export function LineSelectionProvider({ children }) {
  // we’ll just key by numeric lineIdx
  const [selectedLineIdx, setSelectedLineIdx] = useState(null);

  const toggleLine = (lineIdx) =>
    setSelectedLineIdx((prev) => (prev === lineIdx ? null : lineIdx));

  return (
    <LineSelectionContext.Provider value={{ selectedLineIdx, toggleLine }}>
      {children}
    </LineSelectionContext.Provider>
  );
}

export function useLineSelection() {
  return useContext(LineSelectionContext);
}
