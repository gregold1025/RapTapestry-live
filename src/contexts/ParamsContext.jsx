// src/contexts/ParamsContext.jsx
import { isTypingTarget } from "../utils/isTypingTarget";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BASS_DEFAULTS, DRUM_DEFAULTS } from "./paramDefaults";
import { CLOCK_DEFAULTS } from "../components/ClockPane/clockDefaults";
import { clockIndexStore } from "../components/ClockPane/clockIndexStore";

const ParamsContext = createContext();

/* ============================================================
   Glyph assets (loaded once)
   ============================================================ */
const glyphUrlModules = import.meta.glob("/src/svg_shapes/*.svg", {
  eager: true,
  import: "default",
});
const GLYPH_URLS = Object.values(glyphUrlModules);
// Small SVGs are inlined as data: URIs by the bundler, so the file name only
// survives in the glob key: name (without .svg) -> url, and url -> name.
const GLYPH_BY_NAME = Object.fromEntries(Object.entries(glyphUrlModules).map(([k, v]) => [k.split("/").pop().replace(/\.svg$/, ""), v]));
const GLYPH_NAME_OF = new Map(Object.entries(GLYPH_BY_NAME).map(([n, u]) => [u, n]));

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
  const [syllableRadius, setSyllableRadius] = useState(4);
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
  const [bassParams, setBassParams] = useState(BASS_DEFAULTS);

  // — DRUMS —
  const [showDrums, setShowDrums] = useState(true);
  const [showDrumGlyphs, setShowDrumGlyphs] = useState(true);
  const [drumParams, setDrumParams] = useState(DRUM_DEFAULTS);
  const [drumDetection, setDrumDetection] = useState("classes"); // "bands" | "classes" (falls back to bands without classifier output)
  // Per frequency band: visible, glyph size (px), opacity, height (percent of the
  // drum lane), glyphUrl (null = the default drum glyph)
  const [drumBands, setDrumBands] = useState({
    high: { visible: true, size: 10, opacity: 1, height: 30, glyphUrl: null },
    mid:  { visible: true, size: 14, opacity: 1, height: 20, glyphUrl: null },
    low:  { visible: true, size: 16, opacity: 1, height: 10, glyphUrl: null },
  });
  const setDrumBand = useCallback(
    (key, patch) => setDrumBands((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } })),
    []
  );
  // Per classifier class (kick, snare, hi-hat, tom, cymbal, unnamed): same fields.
  // Rows high to low like the Line Staff: hi-hat and cymbal above, snare, tom, kick, unnamed below.
  const [drumClasses, setDrumClasses] = useState({
    hihat:  { visible: true, size: 9,  opacity: 1, height: 33, glyphUrl: null },
    cymbal: { visible: true, size: 11, opacity: 1, height: 33, glyphUrl: null },
    snare:  { visible: true, size: 14, opacity: 1, height: 22, glyphUrl: null },
    tom:    { visible: true, size: 12, opacity: 1, height: 15, glyphUrl: null },
    kick:   { visible: true, size: 16, opacity: 1, height: 10, glyphUrl: null },
    // unnamed onsets: mostly hi-hats or filtered hits; placed around 35% and spread by their frequency band
    other:  { visible: true, size: 5, opacity: 0.6, height: 35, glyphUrl: null },
  });
  const setDrumClass = useCallback(
    (key, patch) => setDrumClasses((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } })),
    []
  );
  // threshold multiplier on the classifier's published per-class thresholds
  const [drumThreshold, setDrumThreshold] = useState(1);

  // — LINE STAFF — (its own sizes: the staff scales to be read, not to the tapestry's glyphs)
  const [staffDrumScale, setStaffDrumScale] = useState(1);
  const [staffBassThickness, setStaffBassThickness] = useState(6); // bass line thickness in the Line Staff (px)
  // Line Staff text: the bottom of its pitch band, percent of the staff height (the band spans 34 points above it)
  const [staffTextHeight, setStaffTextHeight] = useState(63);
  const [staffTextPx, setStaffTextPx] = useState(12);
  const [staffBackgroundColor, setStaffBackgroundColor] = useState("#f7f7f9");
  const [staffWordColor, setStaffWordColor] = useState("#6b6e76"); // unqueried words: text, line, dots
  // grid level: 0 none, 1 bar lines, 2 + beat lines, 3 + eighths, 4 + sixteenths (utils/gridLines.js)
  const [staffGridLevel, setStaffGridLevel] = useState(2);
  const [gridLevel, setGridLevel] = useState(2);

  // — RHYME CLOCK — (its own settings; defaults in ClockPane/clockDefaults.js)
  const [clockCycleBars, setClockCycleBars] = useState(CLOCK_DEFAULTS.cycleBars);
  const [clockRings, setClockRingsRaw] = useState(CLOCK_DEFAULTS.rings);
  const [clockWords, setClockWords] = useState(CLOCK_DEFAULTS.words);
  const [clockBackgroundColor, setClockBackgroundColor] = useState(CLOCK_DEFAULTS.backgroundColor);
  const [clockWordColor, setClockWordColor] = useState(CLOCK_DEFAULTS.wordColor);
  const [clockTextPx, setClockTextPx] = useState(CLOCK_DEFAULTS.textPx);
  const [clockShowDrums, setClockShowDrums] = useState(CLOCK_DEFAULTS.showDrums);
  const [clockDrumScale, setClockDrumScale] = useState(CLOCK_DEFAULTS.drumScale);
  // fewer rings than the current ring's position: the position moves in
  // (the position itself lives in ClockPane/clockIndexStore: it changes every bar while frozen)
  const setClockRings = useCallback((r) => {
    setClockRingsRaw(r);
    if (typeof r === "number") clockIndexStore.clampTo(r);
  }, []);

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
  // D: every drum row (bands and classes) gets a fresh glyph from the syllable
  // set, no two rows alike within a mode.
  const randomizeDrumGlyph = useCallback(() => {
    const shuffle = (prev) => {
      const taken = new Set();
      const out = {};
      for (const key of Object.keys(prev)) {
        const free = GLYPH_URLS.filter((u) => !taken.has(u));   // the data: urls are what rows store
        const u = free.length ? free[Math.floor(Math.random() * free.length)] : null;
        if (u) taken.add(u);
        out[key] = { ...prev[key], glyphUrl: u };
      }
      return out;
    };
    setDrumBands(shuffle);
    setDrumClasses(shuffle);
  }, []);
  const randomizeBassDivider = useCallback(
    () => setBassDividerUrl(pickRandomFrom(BASS_DIVIDER_URLS)), []
  );

  // Central key bindings for glyph randomizers (S/D/B).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;   // Cmd-D is the browser's
      if (isTypingTarget(e.target)) return;

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
      syllableGlyphByName: GLYPH_BY_NAME,
      glyphNameOf: (url) => GLYPH_NAME_OF.get(url) ?? null,
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
        gridLevel,
        setGridLevel,
        showDrumGlyphs,
        setShowDrumGlyphs,
        drumParams,
        setDrumParams,
        drumDetection,
        setDrumDetection,
        drumBands,
        setDrumBands,
        setDrumBand,
        drumClasses,
        setDrumClasses,
        setDrumClass,
        drumThreshold,
        setDrumThreshold,
        staffDrumScale,
        setStaffDrumScale,
        staffBassThickness,
        setStaffBassThickness,
        staffTextHeight,
        setStaffTextHeight,
        staffTextPx,
        setStaffTextPx,
        staffBackgroundColor,
        setStaffBackgroundColor,
        staffWordColor,
        setStaffWordColor,
        staffGridLevel,
        setStaffGridLevel,
        clockCycleBars, setClockCycleBars,
        clockRings, setClockRings,
        clockWords, setClockWords,
        clockBackgroundColor, setClockBackgroundColor,
        clockWordColor, setClockWordColor,
        clockTextPx, setClockTextPx,
        clockShowDrums, setClockShowDrums,
        clockDrumScale, setClockDrumScale,

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
