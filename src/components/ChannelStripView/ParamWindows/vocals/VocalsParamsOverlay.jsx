// src/components/ChannelStrips/ParamWindows/vocals/VocalsParamsOverlay.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "../Overlay.css";

export function VocalsParamsOverlay({ onClose }) {
  const {
    // syllable visuals + logic
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

    // word visuals + logic
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

    // NEW word-layer visibility toggles
    showRhymes,
    setShowRhymes,
    showAlliteration,
    setShowAlliteration,

    // line visuals
    showLines,
    setShowLines,
    lineActiveColor,
    setLineActiveColor,
    lineInactiveColor,
    setLineInactiveColor,
    lineOpacity,
    setLineOpacity,

    // NEW line-layer toggle
    showEndRhymes,
    setShowEndRhymes,

    // vowel palette
    vowelColors: contextVowelColors,
    setVowelColors,
  } = useParams();

  // local mirrors for quick UI feedback
  const [wildcard, setWildcard] = useState(wildcardSkips);
  const [minMatch, setMinMatch] = useState(minMatchLen);
  const [colors, setColors] = useState(contextVowelColors);

  useEffect(() => setWildcard(wildcardSkips), [wildcardSkips]);
  useEffect(() => setMinMatch(minMatchLen), [minMatchLen]);
  useEffect(() => setColors(contextVowelColors), [contextVowelColors]);

  const toggle = (fn) => (e) => fn(e.target.checked);
  const pickColor = (fn) => (e) => fn(e.target.value);
  const pickRange = (fn) => (e) => fn(+e.target.value);

  const handleWildcardChange = (e) => {
    const v = Number(e.target.value);
    setWildcard(v);
    setWildcardSkips(v);
  };
  const handleMinMatchChange = (e) => {
    const v = Number(e.target.value);
    setMinMatch(v);
    setMinMatchLen(v);
  };
  const handleVowelColorChange = (vowel, e) => {
    const nc = { ...colors, [vowel]: e.target.value };
    setColors(nc);
    setVowelColors(nc);
  };

  return (
    <div className="params-overlay">
      <div className="params-window">
        <header>
          <h2>Vocal Stem Parameters</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="params-body">
          <div className="visuals-grid">
            {/* ───────────── Syllables ───────────── */}
            <div className="visual-section">
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={showSyllables}
                  onChange={toggle(setShowSyllables)}
                />
                <h3>Syllable Glyphs</h3>
              </label>

              <div className="control">
                Active Vowel Colors
                <div className="palette-grid">
                  {Object.entries(colors).map(([vowel, color]) => (
                    <label key={vowel}>
                      {vowel}
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleVowelColorChange(vowel, e)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <label className="control inline">
                Inactive Color:
                <input
                  type="color"
                  value={inactiveSyllableColor}
                  onChange={pickColor(setInactiveSyllableColor)}
                />
              </label>

              <label className="control">
                Opacity{" "}
                <span className="meta">{syllableOpacity.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={syllableOpacity}
                  onChange={pickRange(setSyllableOpacity)}
                />
              </label>

              <label className="control">
                Radius <span className="meta">{syllableRadius}px</span>
                <input
                  type="range"
                  min={2}
                  max={50}
                  step={1}
                  value={syllableRadius}
                  onChange={pickRange(setSyllableRadius)}
                />
              </label>

              <label className="control">
                Arc Curvature{" "}
                <span className="meta">{syllableArcCurve.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={syllableArcCurve}
                  onChange={pickRange(setSyllableArcCurve)}
                />
              </label>

              <label className="control">
                Max Wildcard Skips <span className="meta">{wildcard}</span>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={wildcard}
                  onChange={handleWildcardChange}
                />
              </label>

              <label className="control">
                Min Match Length <span className="meta">{minMatch}</span>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={minMatch}
                  onChange={handleMinMatchChange}
                />
              </label>
            </div>

            {/* ───────────── Words ───────────── */}
            <div className="visual-section">
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={showWords}
                  onChange={toggle(setShowWords)}
                />
                <h3>Word Glyphs</h3>
              </label>

              <label className="control inline">
                Active Color:
                <input
                  type="color"
                  value={wordActiveColor}
                  onChange={pickColor(setWordActiveColor)}
                />
              </label>

              <label className="control inline">
                Inactive Color:
                <input
                  type="color"
                  value={wordInactiveColor}
                  onChange={pickColor(setWordInactiveColor)}
                />
              </label>

              <label className="control">
                Opacity <span className="meta">{wordOpacity.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={wordOpacity}
                  onChange={pickRange(setWordOpacity)}
                />
              </label>

              {/* NEW toggles */}
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={showRhymes}
                  onChange={toggle(setShowRhymes)}
                />
                Show Rhymes
              </label>

              {/* Existing match logic toggles */}
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={exactMatches}
                  onChange={toggle(setExactMatches)}
                />
                Exact Match
              </label>

              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={ignorePlurals}
                  onChange={toggle(setIgnorePlurals)}
                />
                Ignore Plurals
              </label>

              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={showAlliteration}
                  onChange={toggle(setShowAlliteration)}
                />
                Show Alliteration
              </label>
            </div>

            {/* ───────────── Lines ───────────── */}
            <div className="visual-section">
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={showLines}
                  onChange={toggle(setShowLines)}
                />
                <h3>Line Glyphs</h3>
              </label>

              <label className="control inline">
                Active Color:
                <input
                  type="color"
                  value={lineActiveColor}
                  onChange={pickColor(setLineActiveColor)}
                />
              </label>

              <label className="control inline">
                Inactive Color:
                <input
                  type="color"
                  value={lineInactiveColor}
                  onChange={pickColor(setLineInactiveColor)}
                />
              </label>

              <label className="control">
                Opacity <span className="meta">{lineOpacity.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={lineOpacity}
                  onChange={pickRange(setLineOpacity)}
                />
              </label>

              {/* NEW toggle */}
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={showEndRhymes}
                  onChange={toggle(setShowEndRhymes)}
                />
                End Rhymes
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
