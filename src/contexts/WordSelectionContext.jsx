import { createContext, useContext, useState } from "react";

const WordSelectionContext = createContext();

export function WordSelectionProvider({ children }) {
  const [selectedWordId, setSelectedWordId] = useState(null);

  const toggleWord = (wordId) => {
    setSelectedWordId((prev) => (prev === wordId ? null : wordId));
  };

  return (
    <WordSelectionContext.Provider value={{ selectedWordId, toggleWord }}>
      {children}
    </WordSelectionContext.Provider>
  );
}

export function useWordSelection() {
  return useContext(WordSelectionContext);
}
