// src/contexts/ParamsContext.jsx
import React, { createContext, useContext, useState } from "react";

const ParamsContext = createContext();

export function ParamsProvider({ children }) {
  // … your existing state …
  const [showVocals, setShowVocals] = useState(true);
  const [wildcardSkips, setWildcardSkips] = useState(1);
  const [minMatchLen, setMinMatchLen] = useState(2);
  const [vowelColors, setVowelColors] = useState({
    AA: "#00c2a0",
    AE: "#ffff33",
    AH: "#a26dc3",
    AO: "#ff4c3b",
    AW: "#3790d9",
    AY: "#ffa726",
    EH: "#79d043",
    ER: "#ff87d2",
    EY: "#f042c9",
    IH: "#b23ec7",
    IY: "#a3f9a1",
    OW: "#ffd600",
    OY: "#3cb6a2",
    UH: "#f4511e",
    UW: "#5c6bc0",
  });

  // ** syllables **
  const [showSyllables, setShowSyllables] = useState(true);
  const [inactiveSyllableColor, setInactiveSyllableColor] = useState("#bbbbbb");
  const [syllableOpacity, setSyllableOpacity] = useState(1);

  // ** words **
  const [showWords, setShowWords] = useState(true);
  const [wordActiveColor, setWordActiveColor] = useState("#00aaff");
  const [wordInactiveColor, setWordInactiveColor] = useState("#cccccc");
  const [wordOpacity, setWordOpacity] = useState(0.6);

  // ** lines **
  const [showLines, setShowLines] = useState(true);
  const [lineActiveColor, setLineActiveColor] = useState("#00cc00");
  const [lineInactiveColor, setLineInactiveColor] = useState("#eeeeee");
  const [lineOpacity, setLineOpacity] = useState(0.3);

  // bass etc...
  const [showBass, setShowBass] = useState(true);
  const [bassParams, setBassParams] = useState({
    rectHeight: 10,
    fillColor: "#aaccff",
    opacity: 0.7,
  });

  return (
    <ParamsContext.Provider
      value={{
        // — vocals / syllables —
        showVocals,
        setShowVocals,
        wildcardSkips,
        setWildcardSkips,
        minMatchLen,
        setMinMatchLen,
        vowelColors,
        setVowelColors,

        showSyllables,
        setShowSyllables,
        inactiveSyllableColor,
        setInactiveSyllableColor,
        syllableOpacity,
        setSyllableOpacity,

        // — words —
        showWords,
        setShowWords,
        wordActiveColor,
        setWordActiveColor,
        wordInactiveColor,
        setWordInactiveColor,
        wordOpacity,
        setWordOpacity,

        // — lines —
        showLines,
        setShowLines,
        lineActiveColor,
        setLineActiveColor,
        lineInactiveColor,
        setLineInactiveColor,
        lineOpacity,
        setLineOpacity,

        // — bass (existing) —
        showBass,
        setShowBass,
        bassParams,
        setBassParams,
      }}
    >
      {children}
    </ParamsContext.Provider>
  );
}

export function useParams() {
  return useContext(ParamsContext);
}
