import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "./VocalsParamsOverlay.css";

export function VocalsParamsOverlay({ onClose }) {
  const {
    // matching params
    wildcardSkips,
    setWildcardSkips,
    minMatchLen,
    setMinMatchLen,
    vowelColors: contextVowelColors,
    setVowelColors,

    // syllable visuals
    showSyllables,
    setShowSyllables,
    inactiveSyllableColor,
    setInactiveSyllableColor,
    syllableOpacity,
    setSyllableOpacity,

    // word visuals
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

    // line visuals
    showLines,
    setShowLines,
    lineActiveColor,
    setLineActiveColor,
    lineInactiveColor,
    setLineInactiveColor,
    lineOpacity,
    setLineOpacity,
  } = useParams();

  // Local copies for numeric & palette controls
  const [wildcard, setWildcard] = useState(wildcardSkips);
  const [minMatch, setMinMatch] = useState(minMatchLen);
  const [colors, setColors] = useState(contextVowelColors);

  useEffect(() => setWildcard(wildcardSkips), [wildcardSkips]);
  useEffect(() => setMinMatch(minMatchLen), [minMatchLen]);
  useEffect(() => setColors(contextVowelColors), [contextVowelColors]);

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

  const toggle = (fn) => (e) => fn(e.target.checked);
  const pickColor = (fn) => (e) => fn(e.target.value);
  const pickRange = (fn) => (e) => fn(+e.target.value);

  return (
    <div className="vocals-params-overlay">
      <div className="vocals-params-window">
        <header>
          <h2>Vocal Stem Parameters</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="visuals-grid">
          {/* ── Syllable Visuals ── */}
          <div className="visual-section syllable-visuals">
            <h3>Syllable Visuals</h3>
            <label className="toggle-control">
              <input
                type="checkbox"
                checked={showSyllables}
                onChange={toggle(setShowSyllables)}
              />
              Show Syllables
            </label>

            <div className="color-palette">
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

            <label>
              Inactive Color:
              <input
                type="color"
                value={inactiveSyllableColor}
                onChange={pickColor(setInactiveSyllableColor)}
              />
            </label>

            <label>
              Opacity:
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={syllableOpacity}
                onChange={pickRange(setSyllableOpacity)}
              />
            </label>

            <div className="number-controls">
              <label>
                Max Wildcard Skips:
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={wildcard}
                  onChange={handleWildcardChange}
                />
              </label>
              <label>
                Min Match Length:
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={minMatch}
                  onChange={handleMinMatchChange}
                />
              </label>
            </div>
          </div>

          {/* ── Word Visuals ── */}
          <div className="visual-section word-visuals">
            <h3>Word Visuals</h3>
            <label className="toggle-control">
              <input
                type="checkbox"
                checked={showWords}
                onChange={toggle(setShowWords)}
              />
              Show Words
            </label>

            <label>
              Active Color:
              <input
                type="color"
                value={wordActiveColor}
                onChange={pickColor(setWordActiveColor)}
              />
            </label>

            <label>
              Inactive Color:
              <input
                type="color"
                value={wordInactiveColor}
                onChange={pickColor(setWordInactiveColor)}
              />
            </label>

            <label>
              Opacity:
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={wordOpacity}
                onChange={pickRange(setWordOpacity)}
              />
            </label>

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
          </div>

          {/* ── Line Visuals ── */}
          <div className="visual-section line-visuals">
            <h3>Line Visuals</h3>
            <label className="toggle-control">
              <input
                type="checkbox"
                checked={showLines}
                onChange={toggle(setShowLines)}
              />
              Show Lines
            </label>

            <label>
              Active Color:
              <input
                type="color"
                value={lineActiveColor}
                onChange={pickColor(setLineActiveColor)}
              />
            </label>

            <label>
              Inactive Color:
              <input
                type="color"
                value={lineInactiveColor}
                onChange={pickColor(setLineInactiveColor)}
              />
            </label>

            <label>
              Opacity:
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={lineOpacity}
                onChange={pickRange(setLineOpacity)}
              />
            </label>
          </div>
        </div>

        <footer>
          <button onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}
