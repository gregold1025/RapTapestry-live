import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "./DrumsParamsOverlay.css";

export function DrumsParamsOverlay({ onClose }) {
  const { drumParams, setDrumParams } = useParams();

  // Fallbacks so older saved states don't break
  const [strokeWeight, setStrokeWeight] = useState(drumParams.lineWeight ?? 2);
  const [tilt, setTilt] = useState(drumParams.tilt ?? 0);
  const [fillColor, setFillColor] = useState(drumParams.fillColor ?? "#ff8800");
  const [opacity, setOpacity] = useState(drumParams.opacity ?? 0.8);

  useEffect(() => {
    setStrokeWeight(drumParams.strokeWeight ?? 2);
    setTilt(drumParams.tilt ?? 0);
    setFillColor(drumParams.fillColor ?? "#ff8800");
    setOpacity(drumParams.opacity ?? 0.8);
  }, [drumParams]);

  const handleSave = () => {
    setDrumParams({ strokeWeight, tilt, fillColor, opacity });
    onClose();
  };

  const handleStrokeChange = (e) => {
    const newValue = Number(e.target.value);
    setStrokeWeight(newValue);
    setDrumParams((prev) => ({ ...prev, strokeWeight: newValue }));
  };

  const handleTiltChange = (e) => {
    const newValue = Number(e.target.value);
    setTilt(newValue);
    setDrumParams((prev) => ({ ...prev, tilt: newValue }));
  };

  const handleOpacityChange = (e) => {
    const newValue = Number(e.target.value);
    setOpacity(newValue);
    setDrumParams((prev) => ({ ...prev, opacity: newValue }));
  };

  const handleColorChange = (e) => {
    const newValue = e.target.value;
    setFillColor(newValue);
    setDrumParams((prev) => ({ ...prev, fillColor: newValue }));
  };

  return (
    <div className="drums-params-overlay">
      <div className="drums-params-window">
        <header>
          <h2>Drums Stem Parameters</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <section className="number-controls">
          <label>
            Stroke Weight:
            <input
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={strokeWeight}
              onChange={handleStrokeChange}
            />
            <span>{strokeWeight}px</span>
          </label>

          <label>
            Tilt:
            <input
              type="range"
              min={-90}
              max={90}
              step={1}
              value={tilt}
              onChange={handleTiltChange}
            />
            <span>{tilt}°</span>
          </label>

          <label>
            Opacity:
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={opacity}
              onChange={handleOpacityChange}
            />
            <span>{opacity.toFixed(2)}</span>
          </label>
        </section>

        <section className="color-control">
          <label>
            Fill Color:
            <input
              type="color"
              value={fillColor}
              onChange={handleColorChange}
            />
          </label>
        </section>

        <footer>
          <button onClick={handleSave}>Save</button>
        </footer>
      </div>
    </div>
  );
}
