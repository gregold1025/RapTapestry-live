import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "./BassParamsOverlay.css";

export function BassParamsOverlay({ onClose }) {
  const { bassParams, setBassParams } = useParams();

  // fallbacks so older saved states don't break if blur wasn't set yet
  const [rectHeight, setRectHeight] = useState(bassParams.rectHeight ?? 40);
  const [fillColor, setFillColor] = useState(bassParams.fillColor ?? "#00ff88");
  const [opacity, setOpacity] = useState(bassParams.opacity ?? 0.8);
  const [blur, setBlur] = useState(bassParams.blur ?? 0);

  useEffect(() => {
    setRectHeight(bassParams.rectHeight ?? 40);
    setFillColor(bassParams.fillColor ?? "#00ff88");
    setOpacity(bassParams.opacity ?? 0.8);
    setBlur(bassParams.blur ?? 0);
  }, [bassParams]);

  const handleSave = () => {
    setBassParams({ rectHeight, fillColor, opacity, blur });
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

  const handleBlurChange = (e) => {
    const newValue = Number(e.target.value);
    setBlur(newValue);
    setBassParams((prev) => ({ ...prev, blur: newValue }));
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
              onChange={handleOpacityChange}
            />
            <span>{opacity.toFixed(2)}</span>
          </label>

          {/* NEW: Blur slider */}
          <label>
            Blur:
            <input
              type="range"
              min={0}
              max={30}
              step={0.5}
              value={blur}
              onChange={handleBlurChange}
            />
            <span>{blur.toFixed(1)}px</span>
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
