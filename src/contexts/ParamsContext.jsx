import React, { createContext, useContext, useState } from "react";

const ParamsContext = createContext();

export function ParamsProvider({ children }) {
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

  const [inactiveSyllableColor, setInactiveSyllableColor] = useState("#ffffff");
  const [showWordRects, setShowWordRects] = useState(true);

  const [showBass, setShowBass] = useState(true);

  const [bassParams, setBassParams] = useState({
    rectHeight: 10,
    fillColor: "#aaccff",
    opacity: 0.7,
  });

  return (
    <ParamsContext.Provider
      value={{
        // Vocals
        showVocals,
        setShowVocals,
        wildcardSkips,
        setWildcardSkips,
        minMatchLen,
        setMinMatchLen,
        vowelColors,
        setVowelColors,
        inactiveSyllableColor,
        setInactiveSyllableColor,
        showWordRects,
        setShowWordRects,

        // Bass
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
