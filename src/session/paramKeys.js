// src/session/paramKeys.js
// Every parameter a session holds (Greg 2026-11-09: "everything"): the Params context's state,
// each with a setter set<Key>. A test keeps this list in step with the context.
export const PARAM_KEYS = [
  "rowHeightMode",
  "fixedRowHeightPx",
  "barsPerRow",
  "timeLayout",
  "stemsLayout",
  "tapestryBackgroundColor",
  "showVocals",
  "vowelColors",
  "syllableStrictness",
  "showSyllables",
  "inactiveSyllableColor",
  "syllableInactiveOpacity",
  "syllableOpacity",
  "syllableMode",
  "syllableBand",
  "syllableFixedHeight",
  "syllableRadius",
  "syllableArcCurve",
  "wildcardSkips",
  "minMatchLen",
  "showWords",
  "wordActiveColor",
  "wordInactiveColor",
  "wordInactiveOpacity",
  "wordOpacity",
  "wordMode",
  "wordThicknessPx",
  "wordCenter",
  "wordBand",
  "exactMatches",
  "showRhymes",
  "rhymeStrictness",
  "rhymeSearchDistance",
  "codaTolerance",
  "alliterationTier",
  "alliterationSearchDistance",
  "showAssonance",
  "assonanceStrictness",
  "assonanceSearchDistance",
  "showConsonance",
  "consonanceStrictness",
  "consonanceSearchDistance",
  "showLines",
  "lineInactiveColor",
  "lineInactiveOpacity",
  "lineOpacity",
  "lineBand",
  "lineShadow",
  "showEndRhymes",
  "showBass",
  "bassParams",
  "showDrums",
  "showDrumGlyphs",
  "drumParams",
  "drumDetection",
  "drumBands",
  "drumClasses",
  "drumThreshold",
  "staffDrumScale",
  "staffBassThickness",
  "staffTextHeight",
  "staffTextPx",
  "staffDrumHeight",
  "staffBassHeight",
  "staffBackgroundColor",
  "staffWordColor",
  "staffGridLevel",
  "gridLevel",
  "clockCycleBars",
  "clockRings",
  "clockWords",
  "clockBackgroundColor",
  "clockWordColor",
  "clockTextPx",
  "clockShowDrums",
  "clockShowHand",
  "showHorizontalGrid",
  "showVerticalGrid",
  "glyphStyle",
];

const isPlain = (v) => !!v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Set);

/**
 * What to set for each key: the snapshot's value, else the default (replace, not merge). A plain
 * object (drum classes, bands, glyph style) takes the snapshot's entries over the default's, so a
 * row the file lacks keeps its default.
 */
export function paramsToApply(snapshot, defaults, keys = PARAM_KEYS) {
  const out = {};
  for (const k of keys) {
    const has = snapshot && Object.prototype.hasOwnProperty.call(snapshot, k);
    out[k] = !has ? defaults[k] : isPlain(snapshot[k]) && isPlain(defaults[k]) ? { ...defaults[k], ...snapshot[k] } : snapshot[k];
  }
  return out;
}
