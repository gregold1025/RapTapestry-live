import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "../Overlay.css"; // ← NEW shared stylesheet

export function VocalsParamsOverlay({ onClose }) {
  const {
    wildcardSkips,
    setWildcardSkips,
    minMatchLen,
    setMinMatchLen,
    vowelColors: contextVowelColors,
    setVowelColors,

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

    showLines,
    setShowLines,
    lineActiveColor,
    setLineActiveColor,
    lineInactiveColor,
    setLineInactiveColor,
    lineOpacity,
    setLineOpacity,
  } = useParams();

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
            {/* Syllables */}
            <div className="visual-section">
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={showSyllables}
                  onChange={toggle(setShowSyllables)}
                />
                <h3>Syllable Glyphs</h3>
              </label>
              –––––––––––––––––––––––––––––––––––––––––––––––
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
                  max={20}
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
              –––––––––––––––––––––––––––––––––––––––––––––––
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

            {/* Words */}
            <div className="visual-section">
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={showWords}
                  onChange={toggle(setShowWords)}
                />
                <h3>Word Glyphs</h3>
              </label>
              –––––––––––––––––––––––––––––––––––––––––––––––
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
              –––––––––––––––––––––––––––––––––––––––––––––––
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

            {/* Lines */}
            <div className="visual-section">
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={showLines}
                  onChange={toggle(setShowLines)}
                />
                <h3>Line Glyphs</h3>
              </label>
              –––––––––––––––––––––––––––––––––––––––––––––––
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
