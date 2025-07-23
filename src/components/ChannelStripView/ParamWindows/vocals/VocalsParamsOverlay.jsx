import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "./VocalsParamsOverlay.css";

export function VocalsParamsOverlay({ onClose }) {
  const {
    wildcardSkips,
    setWildcardSkips,
    minMatchLen,
    setMinMatchLen,
    vowelColors: contextVowelColors,
    setVowelColors,
    inactiveSyllableColor,
    setInactiveSyllableColor,
    showWordRects,
    setShowWordRects,
  } = useParams();

  // Local state initialized from context
  const [wildcard, setWildcard] = useState(wildcardSkips);
  const [minMatch, setMinMatch] = useState(minMatchLen);
  const [colors, setColors] = useState(
    Object.keys(contextVowelColors).length > 0
      ? contextVowelColors
      : vowelColors
  );

  useEffect(() => {
    setWildcard(wildcardSkips);
  }, [wildcardSkips]);

  useEffect(() => {
    setMinMatch(minMatchLen);
  }, [minMatchLen]);

  useEffect(() => {
    setColors(contextVowelColors);
  }, [contextVowelColors]);

  const handleWildcardChange = (e) => {
    const val = Number(e.target.value);
    setWildcard(val);
    setWildcardSkips(val);
  };

  const handleMinMatchChange = (e) => {
    const val = Number(e.target.value);
    setMinMatch(val);
    setMinMatchLen(val);
  };

  const handleColorChange = (vowel, e) => {
    const newColors = { ...colors, [vowel]: e.target.value };
    setColors(newColors);
    setVowelColors(newColors);
  };

  return (
    <div className="vocals-params-overlay">
      <div className="vocals-params-window">
        <header>
          <h2>Vocal Stem Parameters</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <section className="number-controls">
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
        </section>

        <section className="color-palette">
          <h3>Vowel Colors</h3>
          <div className="palette-grid">
            {Object.entries(colors).map(([vowel, color]) => (
              <label key={vowel}>
                {vowel}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(vowel, e)}
                />
              </label>
            ))}
          </div>
        </section>
        <section className="color-control">
          <label>
            Inactive Syllable Color:
            <input
              type="color"
              value={inactiveSyllableColor}
              onChange={(e) => setInactiveSyllableColor(e.target.value)}
            />
          </label>
        </section>
        <section className="toggle-control">
          <label>
            Show Word Rectangles
            <input
              type="checkbox"
              checked={showWordRects}
              onChange={(e) => setShowWordRects(e.target.checked)}
            />
          </label>
        </section>

        <footer>
          <button onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}
