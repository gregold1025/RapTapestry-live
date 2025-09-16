import { useState } from "react";

export function VolumeControl({ volume, onVolumeChange }) {
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div
      className="volume-control"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <span role="img" aria-label="volume" className="volume-icon">
        🔊
      </span>

      {showSlider && (
        <div className="volume-popover">
          <input
            className="volume-range"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}
