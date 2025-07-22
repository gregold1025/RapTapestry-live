import { createContext, useContext, useState } from "react";

const LineSelectionContext = createContext();

export function LineSelectionProvider({ children }) {
  const [selectedLineIdx, setSelectedLineIdx] = useState(null);

  const toggleLine = (lineIdx) => {
    setSelectedLineIdx((prev) => (prev === lineIdx ? null : lineIdx));
  };

  return (
    <LineSelectionContext.Provider value={{ selectedLineIdx, toggleLine }}>
      {children}
    </LineSelectionContext.Provider>
  );
}

export function useLineSelection() {
  return useContext(LineSelectionContext);
}
