import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "./BassParamsOverlay.css";

export function BassParamsOverlay({ onClose }) {
  const { bassParams, setBassParams } = useParams();

  const [rectHeight, setRectHeight] = useState(bassParams.rectHeight);
  const [fillColor, setFillColor] = useState(bassParams.fillColor);
  const [opacity, setOpacity] = useState(bassParams.opacity);

  useEffect(() => {
    setRectHeight(bassParams.rectHeight);
    setFillColor(bassParams.fillColor);
    setOpacity(bassParams.opacity);
  }, [bassParams]);

  const handleSave = () => {
    setBassParams({ rectHeight, fillColor, opacity });
    onClose();
  };

  const handleHeightChange = (e) => {
    const newValue = Number(e.target.value);
    setRectHeight(newValue);
    setBassParams((prev) => ({ ...prev, rectHeight: newValue }));
  };

  const handleOpacityChange = (e) => {
    const newValue = Number(e.target.value);
    setOpacity(newValue);
    setBassParams((prev) => ({ ...prev, opacity: newValue }));
  };

  const handleColorChange = (e) => {
    const newValue = e.target.value;
    setFillColor(newValue);
    setBassParams((prev) => ({ ...prev, fillColor: newValue }));
  };

  return (
    <div className="bass-params-overlay">
      <div className="bass-params-window">
        <header>
          <h2>Bass Stem Parameters</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <section className="number-controls">
          <label>
            Rectangle Height:
            <input
              type="number"
              min={1}
              max={100}
              value={rectHeight}
              onChange={handleHeightChange}
            />
          </label>
          <label>
            Opacity:
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={opacity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setOpacity(val);
                setBassParams((prev) => ({ ...prev, opacity: val }));
              }}
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
