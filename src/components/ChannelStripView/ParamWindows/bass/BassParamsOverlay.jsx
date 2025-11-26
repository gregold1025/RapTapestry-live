import React, { useState, useEffect } from "react";
import { useParams } from "../../../../contexts/ParamsContext";
import "../Overlay.css";

export function BassParamsOverlay({ onClose }) {
  const { bassParams, setBassParams } = useParams();

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

  const handleHeightChange = (e) => {
    const v = Number(e.target.value);
    setRectHeight(v);
    setBassParams((p) => ({ ...p, rectHeight: v }));
  };
  const handleOpacityChange = (e) => {
    const v = Number(e.target.value);
    setOpacity(v);
    setBassParams((p) => ({ ...p, opacity: v }));
  };
  const handleColorChange = (e) => {
    const v = e.target.value;
    setFillColor(v);
    setBassParams((p) => ({ ...p, fillColor: v }));
  };
  const handleBlurChange = (e) => {
    const v = Number(e.target.value);
    setBlur(v);
    setBassParams((p) => ({ ...p, blur: v }));
  };

  return (
    <div className="params-overlay">
      <div className="params-window">
        <header>
          <h2>Bass Stem Parameters</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="params-body">
          <div className="visuals-grid">
            <div className="visual-section">
              <h3>Glyph</h3>

              <label className="control">
                Rectangle Height <span className="meta">{rectHeight}px</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={rectHeight}
                  onChange={handleHeightChange}
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

              <label className="control">
                Blur <span className="meta">{blur.toFixed(1)}px</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.2}
                  value={blur}
                  onChange={handleBlurChange}
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
