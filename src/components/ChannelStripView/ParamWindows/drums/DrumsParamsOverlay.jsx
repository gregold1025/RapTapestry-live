import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "../Overlay.css";

export function DrumsParamsOverlay({ onClose }) {
  const { drumParams, setDrumParams } = useParams();

  const [strokeWeight, setStrokeWeight] = useState(
    drumParams.strokeWeight ?? 2
  );
  const [tilt, setTilt] = useState(drumParams.tilt ?? 0);
  const [fillColor, setFillColor] = useState(drumParams.fillColor ?? "#ff8800");
  const [opacity, setOpacity] = useState(drumParams.opacity ?? 0.8);

  useEffect(() => {
    setStrokeWeight(drumParams.strokeWeight ?? 2);
    setTilt(drumParams.tilt ?? 0);
    setFillColor(drumParams.fillColor ?? "#ff8800");
    setOpacity(drumParams.opacity ?? 0.8);
  }, [drumParams]);

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
          <div className="visuals-grid">
            <div className="visual-section">
              <h3>Stroke & Shape</h3>

              <label className="control">
                Stroke Weight <span className="meta">{strokeWeight}px</span>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={0.5}
                  value={strokeWeight}
                  onChange={handleStrokeChange}
                />
              </label>

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

              <label className="control inline">
                Fill Color:
                <input
                  type="color"
                  value={fillColor}
                  onChange={handleColorChange}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
