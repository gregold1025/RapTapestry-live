// src/components/ChannelStrips/ParamWindows/vocals/VocalsParamsOverlay.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "../Overlay.css";

function SectionHeader({ label, checked, onChange }) {
  return (
    <label className="toggle-control" style={{ marginBottom: "0.25rem" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{label}</h2>
    </label>
  );
}

export function VocalsParamsOverlay({ onClose }) {
  const {
    // Words — visual
    showWords, setShowWords,
    wordActiveColor, setWordActiveColor,
    wordInactiveColor, setWordInactiveColor,
    wordOpacity, setWordOpacity,

    // Syllables — visual
    showSyllables, setShowSyllables,
    inactiveSyllableColor, setInactiveSyllableColor,
    syllableOpacity, setSyllableOpacity,
    syllableRadius, setSyllableRadius,
    vowelColors: contextVowelColors, setVowelColors,

    // Lines — visual
    showLines, setShowLines,
    lineActiveColor, setLineActiveColor,
    lineInactiveColor, setLineInactiveColor,
    lineOpacity, setLineOpacity,
  } = useParams();

  const [colors, setColors] = useState(contextVowelColors);
  const [isVowelPaletteOpen, setIsVowelPaletteOpen] = useState(false);

  useEffect(() => setColors(contextVowelColors), [contextVowelColors]);

  const pickRange = (fn) => (e) => fn(+e.target.value);
  const pickColor = (fn) => (e) => fn(e.target.value);

  return (
    <div className="params-overlay">
      <div className="params-window">
        <header>
          <h1>Vocal Appearance</h1>
          <button className="close-btn" onClick={onClose}>x</button>
        </header>

        <div className="params-body">
          <div className="visuals-grid">

            {/* ── COLUMN 1: WORD GLYPHS ── */}
            <div className="visual-section">
              <SectionHeader label="Word Glyphs" checked={showWords} onChange={setShowWords} />

              <label className="control inline">
                Active Color:
                <input type="color" value={wordActiveColor} onChange={pickColor(setWordActiveColor)} />
              </label>

              <label className="control inline">
                Inactive Color:
                <input type="color" value={wordInactiveColor} onChange={pickColor(setWordInactiveColor)} />
              </label>

              <label className="control">
                Opacity <span className="meta">{wordOpacity.toFixed(2)}</span>
                <input type="range" min={0} max={1} step={0.05}
                  value={wordOpacity} onChange={pickRange(setWordOpacity)} />
              </label>
            </div>

            {/* ── COLUMN 2: SYLLABLE GLYPHS ── */}
            <div className="visual-section">
              <SectionHeader label="Syllable Glyphs" checked={showSyllables} onChange={setShowSyllables} />

              <div className="control">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Vowel Colors</span>
                  <button type="button"
                    onClick={() => setIsVowelPaletteOpen((v) => !v)}
                    aria-expanded={isVowelPaletteOpen}
                    style={{ marginLeft: "auto", border: "none", background: "transparent", cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
                  >
                    {isVowelPaletteOpen ? "\u25b2" : "\u25bc"}
                  </button>
                </div>
                {isVowelPaletteOpen && (
                  <div className="palette-grid" id="vowel-palette">
                    {Object.entries(colors).map(([vowel, color]) => (
                      <label key={vowel}>
                        {vowel}
                        <input type="color" value={color} onChange={(e) => {
                          const nc = { ...colors, [vowel]: e.target.value };
                          setColors(nc); setVowelColors(nc);
                        }} />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <label className="control inline">
                Inactive Color:
                <input type="color" value={inactiveSyllableColor} onChange={pickColor(setInactiveSyllableColor)} />
              </label>

              <label className="control">
                Opacity <span className="meta">{syllableOpacity.toFixed(2)}</span>
                <input type="range" min={0} max={1} step={0.05}
                  value={syllableOpacity} onChange={pickRange(setSyllableOpacity)} />
              </label>

              <label className="control">
                Radius <span className="meta">{syllableRadius}px</span>
                <input type="range" min={2} max={50} step={1}
                  value={syllableRadius} onChange={pickRange(setSyllableRadius)} />
              </label>
            </div>

            {/* ── COLUMN 3: LINE GLYPHS ── */}
            <div className="visual-section">
              <SectionHeader label="Line Glyphs" checked={showLines} onChange={setShowLines} />

              <label className="control inline">
                Active Color:
                <input type="color" value={lineActiveColor} onChange={pickColor(setLineActiveColor)} />
              </label>

              <label className="control inline">
                Inactive Color:
                <input type="color" value={lineInactiveColor} onChange={pickColor(setLineInactiveColor)} />
              </label>

              <label className="control">
                Opacity <span className="meta">{lineOpacity.toFixed(2)}</span>
                <input type="range" min={0} max={1} step={0.05}
                  value={lineOpacity} onChange={pickRange(setLineOpacity)} />
              </label>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
