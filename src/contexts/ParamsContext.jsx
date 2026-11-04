// src/contexts/ParamsContext.jsx
import React, {
  createContext,
  useCallback,
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
  const [rowHeightMode, setRowHeightMode] = useState("fit"); // "fit" | "fixed"
  const [fixedRowHeightPx, setFixedRowHeightPx] = useState(120);
  const [barsPerRow, setBarsPerRow] = useState(8); // 2 | 4 | 8
  const [timeLayout, setTimeLayout] = useState("wrap"); // "wrap" (scroll, fold: coming soon)
  const [stemsLayout, setStemsLayout] = useState("superimposed"); // "superimposed" | "separated"
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
  // Syllable sequence matching — continuous strictness [0–1]
  const [syllableStrictness, setSyllableStrictness] = useState(0.7);
  // visual
  const [showSyllables, setShowSyllables] = useState(true);
  const [inactiveSyllableColor, setInactiveSyllableColor] = useState("#9e9ea2");
  const [syllableInactiveOpacity, setSyllableInactiveOpacity] = useState(0);
  const [syllableOpacity, setSyllableOpacity] = useState(0.8);
  const [syllableMode, setSyllableMode] = useState("pitched"); // "unpitched" | "pitched"
  const [syllableBand, setSyllableBand] = useState({ lo: 30, hi: 85 });
  const [syllableFixedHeight, setSyllableFixedHeight] = useState(60);
  const [syllableRadius, setSyllableRadius] = useState(7);
  const [syllableArcCurve, setSyllableArcCurve] = useState(1);
  // logical
  const [wildcardSkips, setWildcardSkips] = useState(1);
  const [minMatchLen, setMinMatchLen] = useState(2);

  // — WORDS —
  // visual
  const [showWords, setShowWords] = useState(true);
  const [wordActiveColor, setWordActiveColor] = useState("#00aaff");
  const [wordInactiveColor, setWordInactiveColor] = useState("#9e9ea2");
  const [wordInactiveOpacity, setWordInactiveOpacity] = useState(0);
  const [wordOpacity, setWordOpacity] = useState(0.6);
  const [wordMode, setWordMode] = useState("unpitched"); // "unpitched" | "pitched" | "perSyllable"
  const [wordThicknessPx, setWordThicknessPx] = useState(10);
  const [wordCenter, setWordCenter] = useState(50);
  const [wordBand, setWordBand] = useState({ lo: 30, hi: 85 });

  // logical / per-type phonetic matching
  const [exactMatches, setExactMatches] = useState(false);

  // Rhyme (nucleus + coda) — continuous strictness [0–1], search distance in lines
  const [showRhymes, setShowRhymes] = useState(true);
  const [rhymeStrictness, setRhymeStrictness] = useState(1.0);
  const [rhymeSearchDistance, setRhymeSearchDistance] = useState(999);
  // Coda tolerance: how strict the coda gate is relative to nucleus (0–1).
  // codaThreshold = nucleusThreshold * codaTolerance.
  // Default 0.65: see phonemeSimilarity.js DEFAULT_CODA_TOLERANCE for rationale.
  const [codaTolerance, setCodaTolerance] = useState(0.65);

  // Alliteration (onset) — discrete tier: 'off' | 'exact' | 'near', search distance in lines
  const [alliterationTier, setAlliterationTier] = useState('exact');
  const [alliterationSearchDistance, setAlliterationSearchDistance] = useState(999);

  // Assonance (nucleus only) — continuous strictness [0–1], search distance in lines
  const [showAssonance, setShowAssonance] = useState(false);
  const [assonanceStrictness, setAssonanceStrictness] = useState(1.0);
  const [assonanceSearchDistance, setAssonanceSearchDistance] = useState(999);

  // Consonance (coda only) — continuous strictness [0–1], search distance in lines
  const [showConsonance, setShowConsonance] = useState(false);
  const [consonanceStrictness, setConsonanceStrictness] = useState(0.7);
  const [consonanceSearchDistance, setConsonanceSearchDistance] = useState(999);

  // — LINES —
  const [showLines, setShowLines] = useState(true);
  const [lineInactiveColor, setLineInactiveColor] = useState("#9e9ea2");
  const [lineInactiveOpacity, setLineInactiveOpacity] = useState(0);
  const [lineOpacity, setLineOpacity] = useState(0.3);
  const [lineBand, setLineBand] = useState({ lo: 5, hi: 95 });
  const [lineShadow, setLineShadow] = useState(0);
  const [showEndRhymes, setShowEndRhymes] = useState(true);

  // — BASS —
  const [showBass, setShowBass] = useState(true);
  const [bassParams, setBassParams] = useState({
    rectHeight: 0, // gap between the note rect and its topper
    fillColor: "#670079",
    opacity: 0.4,
    blur: 0.2,
    band: { lo: 10, hi: 60 }, // pitch class 0 lands at lo, 11 at hi (percent of the bass lane)
    topper: "divider", // "divider" | "none"
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
  const [drumDetection, setDrumDetection] = useState("bands"); // "bands" (classes: coming soon)
  // Per frequency band: visible, glyph size (px), opacity, height (percent of the drum lane)
  const [drumBands, setDrumBands] = useState({
    high: { visible: true, size: 10, opacity: 1, height: 80 },
    mid:  { visible: true, size: 14, opacity: 1, height: 55 },
    low:  { visible: true, size: 16, opacity: 1, height: 20 },
  });
  const setDrumBand = useCallback(
    (key, patch) => setDrumBands((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } })),
    []
  );
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

  const randomizeSyllableGlyph = useCallback(
    () => setSyllableGlyphUrl(pickRandomFrom(GLYPH_URLS)), []
  );
  const randomizeDrumGlyph = useCallback(
    () => setDrumGlyphUrl(pickRandomFrom(DRUM_GLYPH_URLS)), []
  );
  const randomizeBassDivider = useCallback(
    () => setBassDividerUrl(pickRandomFrom(BASS_DIVIDER_URLS)), []
  );

  // Central key bindings for glyph randomizers (S/D/B).
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
  }, [randomizeSyllableGlyph, randomizeDrumGlyph, randomizeBassDivider]);

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
        barsPerRow,
        setBarsPerRow,
        timeLayout,
        setTimeLayout,
        stemsLayout,
        setStemsLayout,
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
        syllableInactiveOpacity,
        setSyllableInactiveOpacity,
        syllableOpacity,
        setSyllableOpacity,
        syllableMode,
        setSyllableMode,
        syllableBand,
        setSyllableBand,
        syllableFixedHeight,
        setSyllableFixedHeight,
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
        wordInactiveOpacity,
        setWordInactiveOpacity,
        wordOpacity,
        setWordOpacity,
        wordMode,
        setWordMode,
        wordThicknessPx,
        setWordThicknessPx,
        wordCenter,
        setWordCenter,
        wordBand,
        setWordBand,
        exactMatches,
        setExactMatches,
        showRhymes,
        setShowRhymes,
        rhymeStrictness,
        setRhymeStrictness,
        rhymeSearchDistance,
        setRhymeSearchDistance,
        codaTolerance,
        setCodaTolerance,
        alliterationTier,
        setAlliterationTier,
        alliterationSearchDistance,
        setAlliterationSearchDistance,
        showAssonance,
        setShowAssonance,
        assonanceStrictness,
        setAssonanceStrictness,
        assonanceSearchDistance,
        setAssonanceSearchDistance,
        showConsonance,
        setShowConsonance,
        consonanceStrictness,
        setConsonanceStrictness,
        consonanceSearchDistance,
        setConsonanceSearchDistance,
        syllableStrictness,
        setSyllableStrictness,

        // lines
        showLines,
        setShowLines,
        lineInactiveColor,
        setLineInactiveColor,
        lineInactiveOpacity,
        setLineInactiveOpacity,
        lineOpacity,
        setLineOpacity,
        lineBand,
        setLineBand,
        lineShadow,
        setLineShadow,
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
        drumDetection,
        setDrumDetection,
        drumBands,
        setDrumBands,
        setDrumBand,

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
