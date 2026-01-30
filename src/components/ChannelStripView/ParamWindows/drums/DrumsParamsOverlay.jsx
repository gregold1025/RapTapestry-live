// src/components/ChannelStrips/ParamWindows/drums/DrumsParamsOverlay.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "../Overlay.css";

export function DrumsParamsOverlay({ onClose }) {
  const {
    // NEW toggles
    showDrumGlyphs,
    setShowDrumGlyphs,
    showDownbeats,
    setShowDownbeats,
    showBeatsLines, // note: state name includes the "s"
    setShowBeatLines, // setter name (as you defined)
    // Existing drum params blob
    drumParams,
    setDrumParams,
  } = useParams();

  // Local mirrors for sliders/inputs (keeps UI snappy, updates context on change)
  const [strokeWeight, setStrokeWeight] = useState(
    drumParams.strokeWeight ?? 8
  );
  const [tilt, setTilt] = useState(drumParams.tilt ?? -20);
  const [fillColor, setFillColor] = useState(drumParams.fillColor ?? "#0011bb");
  const [opacity, setOpacity] = useState(drumParams.opacity ?? 0.5);

  useEffect(() => {
    setStrokeWeight(drumParams.strokeWeight ?? 8);
    setTilt(drumParams.tilt ?? -20);
    setFillColor(drumParams.fillColor ?? "#0011bb");
    setOpacity(drumParams.opacity ?? 0.5);
  }, [drumParams]);

  // Handlers for sliders/inputs (write-through to context)
  const handleStrokeChange = (e) => {
    const v = Number(e.target.value);
    setStrokeWeight(v);
    setDrumParams((p) => ({ ...p, strokeWeight: v }));
  };
  const handleTiltChange = (e) => {
    const v = Number(e.target.value);
    setTilt(v);
    setDrumParams((p) => ({ ...p, tilt: v }));
  };
  const handleOpacityChange = (e) => {
    const v = Number(e.target.value);
    setOpacity(v);
    setDrumParams((p) => ({ ...p, opacity: v }));
  };
  const handleColorChange = (e) => {
    const v = e.target.value;
    setFillColor(v);
    setDrumParams((p) => ({ ...p, fillColor: v }));
  };

  return (
    <div className="params-overlay">
      <div className="params-window">
        <header>
          <h2>Drums Stem Parameters</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="params-body">
          {/* Force two columns for this overlay */}
          <div
            className="visuals-grid"
            style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            {/* -------- Column 1: Glyphs -------- */}
            <div className="visual-section">
              <h3>Glyphs</h3>

              {/* Show/Hide Drum Glyphs */}
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={!!showDrumGlyphs}
                  onChange={(e) => setShowDrumGlyphs(e.target.checked)}
                />
                Show Drum Glyphs
              </label>

              {/* Stroke Weight */}
              {/* <label className="control">
                Stroke Weight <span className="meta">{strokeWeight}px</span>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={0.5}
                  value={strokeWeight}
                  onChange={handleStrokeChange}
                />
              </label> */}

              {/* Tilt */}
              <label className="control">
                Tilt <span className="meta">{tilt}°</span>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  step={1}
                  value={tilt}
                  onChange={handleTiltChange}
                />
              </label>

              {/* Opacity */}
              <label className="control">
                Opacity <span className="meta">{opacity.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={opacity}
                  onChange={handleOpacityChange}
                />
              </label>

              {/* Fill Color */}
              <label className="control inline">
                Fill Color:
                <input
                  type="color"
                  value={fillColor}
                  onChange={handleColorChange}
                />
              </label>
            </div>

            {/* -------- Column 2: Grid -------- */}
            <div className="visual-section">
              <h3>Grid</h3>

              {/* Downbeats */}
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={!!showDownbeats}
                  onChange={(e) => setShowDownbeats(e.target.checked)}
                />
                Show Downbeats
              </label>

              {/* Beat Lines */}
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={!!showBeatsLines}
                  onChange={(e) => setShowBeatLines(e.target.checked)}
                />
                Show Beat Lines
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
