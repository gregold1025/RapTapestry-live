// src/contexts/ParamsContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ParamsContext = createContext();

/* ============================================================
   Glyph assets (loaded once)
   ============================================================ */
const glyphUrlModules = import.meta.glob("/src/svg_shapes/*.svg", {
  eager: true,
  import: "default",
});
const GLYPH_URLS = Object.values(glyphUrlModules);

const lineGlyphModules = import.meta.glob("/src/svg_lines/*.svg", {
  eager: true,
  import: "default",
});
const DRUM_GLYPH_URLS = Object.values(lineGlyphModules);

const dividerModules = import.meta.glob("/src/svg_dividers/*.svg", {
  eager: true,
  import: "default",
});
const BASS_DIVIDER_URLS = Object.values(dividerModules);

// Safe picker helper
function pickRandomFrom(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx] ?? null;
}

export function ParamsProvider({ children }) {
  // — GLOBAL TAPESTRY (layout/background) —
  const [rowHeightMode, setRowHeightMode] = useState("auto"); // "fixed" | "auto" | ...
  const [fixedRowHeightPx, setFixedRowHeightPx] = useState(100);
  const [tapestryBackgroundColor, setTapestryBackgroundColor] =
    useState("#ffffff");

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
  const [inactiveSyllableColor, setInactiveSyllableColor] =
    useState("transparent");
  const [syllableOpacity, setSyllableOpacity] = useState(0.8);
  const [syllableRadius, setSyllableRadius] = useState(7);
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
  const [ignorePlurals, setIgnorePlurals] = useState(true);
  const [showRhymes, setShowRhymes] = useState(true);
  const [showAlliteration, setShowAlliteration] = useState(true);
  const [assonance, setAssonance] = useState(true);

  // — LINES —
  const [showLines, setShowLines] = useState(true);
  const [lineActiveColor, setLineActiveColor] = useState("#00cc00");
  const [lineInactiveColor, setLineInactiveColor] = useState("transparent");
  const [lineOpacity, setLineOpacity] = useState(0.3);
  const [showEndRhymes, setShowEndRhymes] = useState(true);

  // — BASS —
  const [showBass, setShowBass] = useState(true);
  const [bassParams, setBassParams] = useState({
    rectHeight: 0,
    fillColor: "#670079",
    opacity: 0.4,
    blur: 0.2,
  });

  // — DRUMS —
  const [showDrums, setShowDrums] = useState(true);
  const [showDrumGlyphs, setShowDrumGlyphs] = useState(true);
  const [drumParams, setDrumParams] = useState({
    strokeWeight: 5,
    tilt: -80,
    fillColor: "#0011bb",
    opacity: 0.5,
  });
  const [showDownbeats, setShowDownbeats] = useState(true);
  const [showBeatsLines, setShowBeatLines] = useState(true);

  // — GLOBAL TAPESTRY (grids/background) —
  const [showHorizontalGrid, setShowHorizontalGrid] = useState(true);
  const [showVerticalGrid, setShowVerticalGrid] = useState(true);

  /* ============================================================
     GlyphStyle (NEW)
     - "stateful outcome" params that are set by randomize actions
     ============================================================ */
  const [glyphStyle, setGlyphStyle] = useState(() => ({
    syllableGlyphUrl: pickRandomFrom(GLYPH_URLS), // null => fallback circles in SyllableGlyphs
    drumGlyphUrl: pickRandomFrom(DRUM_GLYPH_URLS), // start with something
    bassDividerUrl: pickRandomFrom(BASS_DIVIDER_URLS), // start with something
  }));

  const setSyllableGlyphUrl = (url) =>
    setGlyphStyle((prev) => ({ ...prev, syllableGlyphUrl: url }));

  const setDrumGlyphUrl = (url) =>
    setGlyphStyle((prev) => ({ ...prev, drumGlyphUrl: url }));

  const setBassDividerUrl = (url) =>
    setGlyphStyle((prev) => ({ ...prev, bassDividerUrl: url }));

  const randomizeSyllableGlyph = () =>
    setSyllableGlyphUrl(pickRandomFrom(GLYPH_URLS));
  const randomizeDrumGlyph = () =>
    setDrumGlyphUrl(pickRandomFrom(DRUM_GLYPH_URLS));
  const randomizeBassDivider = () =>
    setBassDividerUrl(pickRandomFrom(BASS_DIVIDER_URLS));

  // Optional: central key bindings for glyph randomizers (R/D/B).
  // This replaces the three per-component listeners.
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (isTyping) return;

      if (e.key === "s" || e.key === "S") randomizeSyllableGlyph();
      if (e.key === "d" || e.key === "D") randomizeDrumGlyph();
      if (e.key === "b" || e.key === "B") randomizeBassDivider();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose the glyph asset arrays too (optional but useful for debugging / future UI)
  const glyphAssets = useMemo(
    () => ({
      syllableGlyphUrls: GLYPH_URLS,
      drumGlyphUrls: DRUM_GLYPH_URLS,
      bassDividerUrls: BASS_DIVIDER_URLS,
    }),
    []
  );

  return (
    <ParamsContext.Provider
      value={{
        // tapestry/layout
        rowHeightMode,
        setRowHeightMode,
        fixedRowHeightPx,
        setFixedRowHeightPx,
        tapestryBackgroundColor,
        setTapestryBackgroundColor,

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
        assonance,
        setAssonance,

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

        showHorizontalGrid,
        setShowHorizontalGrid,
        showVerticalGrid,
        setShowVerticalGrid,

        // glyph style (NEW)
        glyphStyle,
        setGlyphStyle,
        setSyllableGlyphUrl,
        setDrumGlyphUrl,
        setBassDividerUrl,
        randomizeSyllableGlyph,
        randomizeDrumGlyph,
        randomizeBassDivider,
        glyphAssets,
      }}
    >
      {children}
    </ParamsContext.Provider>
  );
}

export function useParams() {
  return useContext(ParamsContext);
}
