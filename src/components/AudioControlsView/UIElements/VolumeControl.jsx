import { useState } from "react";

export function VolumeControl({ volume, onVolumeChange }) {
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <span role="img" aria-label="volume" style={{ cursor: "pointer" }}>
        🔊
      </span>
      {showSlider && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          style={{
            position: "absolute",
            top: "-40px",
            right: "0",
            width: "100px",
            transform: "rotate(-90deg)",
            transformOrigin: "top right",
          }}
        />
      )}
    </div>
  );
}
