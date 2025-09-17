// src/contexts/ParamsContext.jsx
import React, { createContext, useContext, useState } from "react";

const ParamsContext = createContext();

export function ParamsProvider({ children }) {
  // — VOCALS —
  const [showVocals, setShowVocals] = useState(true);
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

  // — SYLLABLES —
  // visual
  const [showSyllables, setShowSyllables] = useState(true);
  const [inactiveSyllableColor, setInactiveSyllableColor] = useState("#bbbbbb");
  const [syllableOpacity, setSyllableOpacity] = useState(1);
  const [syllableRadius, setSyllableRadius] = useState(8);
  const [syllableArcCurve, setSyllableArcCurve] = useState(1);
  // logical
  const [wildcardSkips, setWildcardSkips] = useState(1);
  const [minMatchLen, setMinMatchLen] = useState(2);

  // — WORDS —
  // visual
  const [showWords, setShowWords] = useState(true);
  const [wordActiveColor, setWordActiveColor] = useState("#00aaff");
  const [wordInactiveColor, setWordInactiveColor] = useState("transparent");
  const [wordOpacity, setWordOpacity] = useState(0.6);
  // logical / selection-display
  const [exactMatches, setExactMatches] = useState(false);
  const [ignorePlurals, setIgnorePlurals] = useState(false);
  const [showRhymes, setShowRhymes] = useState(true); // NEW: show matchedWordIds on other views
  const [showAlliteration, setShowAlliteration] = useState(true); // NEW: show alliterationMatchedWordIds

  // — LINES —
  const [showLines, setShowLines] = useState(true);
  const [lineActiveColor, setLineActiveColor] = useState("#00cc00");
  const [lineInactiveColor, setLineInactiveColor] = useState("transparent");
  const [lineOpacity, setLineOpacity] = useState(0.3);
  const [showEndRhymes, setShowEndRhymes] = useState(true); // NEW: line-level rhyme highlights

  // — BASS —
  const [showBass, setShowBass] = useState(true);
  const [bassParams, setBassParams] = useState({
    rectHeight: 10,
    fillColor: "#aaccff",
    opacity: 0.7,
    blur: 0,
  });

  // — DRUMS —
  const [showDrums, setShowDrums] = useState(true);
  const [showDrumGlyphs, setShowDrumGlyphs] = useState(true);
  const [drumParams, setDrumParams] = useState({
    strokeWeight: 8,
    tilt: -20,
    fillColor: "#0011bb",
    opacity: 0.5,
  });
  const [showDownbeats, setShowDownbeats] = useState(true);
  const [showBeatsLines, setShowBeatLines] = useState(true);

  // — GLOBAL TAPESTRY (grids/background) —
  const [showHorizontalGrid, setShowHorizontalGrid] = useState(true); // rows
  const [showVerticalGrid, setShowVerticalGrid] = useState(true); // beats
  const [tapestryBackgroundColor, setTapestryBackgroundColor] =
    useState("#ffffff");

  return (
    <ParamsContext.Provider
      value={{
        // vocals
        showVocals,
        setShowVocals,
        vowelColors,
        setVowelColors,

        // syllables
        showSyllables,
        setShowSyllables,
        inactiveSyllableColor,
        setInactiveSyllableColor,
        syllableOpacity,
        setSyllableOpacity,
        syllableRadius,
        setSyllableRadius,
        syllableArcCurve,
        setSyllableArcCurve,
        wildcardSkips,
        setWildcardSkips,
        minMatchLen,
        setMinMatchLen,

        // words
        showWords,
        setShowWords,
        wordActiveColor,
        setWordActiveColor,
        wordInactiveColor,
        setWordInactiveColor,
        wordOpacity,
        setWordOpacity,
        exactMatches,
        setExactMatches,
        ignorePlurals,
        setIgnorePlurals,
        showRhymes,
        setShowRhymes,
        showAlliteration,
        setShowAlliteration,

        // lines
        showLines,
        setShowLines,
        lineActiveColor,
        setLineActiveColor,
        lineInactiveColor,
        setLineInactiveColor,
        lineOpacity,
        setLineOpacity,
        showEndRhymes,
        setShowEndRhymes,

        // bass
        showBass,
        setShowBass,
        bassParams,
        setBassParams,

        // drums
        showDrums,
        setShowDrums,
        showDownbeats,
        setShowDownbeats,
        showBeatsLines,
        setShowBeatLines,
        showDrumGlyphs,
        setShowDrumGlyphs,
        drumParams,
        setDrumParams,

        // tapestry/global
        showHorizontalGrid,
        setShowHorizontalGrid,
        showVerticalGrid,
        setShowVerticalGrid,
        tapestryBackgroundColor,
        setTapestryBackgroundColor,
      }}
    >
      {children}
    </ParamsContext.Provider>
  );
}

export function useParams() {
  return useContext(ParamsContext);
}
