// File: src/components/ChannelStrips/ChannelStrip.jsx

import React, { useState, useEffect } from "react";
import "./ChannelStrip.css";
import { useParams } from "../../contexts/ParamsContext";

/**
 * Generic ChannelStrip for any stem
 * Props:
 * - stemKey: unique key (e.g., 'vocals', 'bass', 'drums', 'other')
 * - audio: HTMLAudioElement for this stem
 * - onEditClick: callback(stemKey)
 * - onSoloToggle: callback(stemKey, isSolo)
 * - onMuteToggle: callback(stemKey, isMuted)
 * - onVisualToggle: callback(stemKey, isVisible)
 */
export function ChannelStrip({
  stemKey,
  audio,
  onEditClick,
  onSoloToggle,
  onMuteToggle,
  onVisualToggle,
  initialVolume = 1,
  initialMuted = false,
  initialSolo = false,
  initialVisible = true,
}) {
  const [volume, setVolume] = useState(initialVolume);
  const [muted, setMuted] = useState(initialMuted);
  const [solo, setSolo] = useState(initialSolo);
  const [visible, setVisible] = useState(initialVisible);

  // Grab the ParamsContext setter for the vocal-visibility flag
  const { setShowVocals, setShowBass, setShowDrums } = useParams();

  useEffect(() => {
    if (audio) {
      audio.volume = volume;
      audio.muted = muted;
    }
  }, [volume, muted, audio]);

  const handleVisualClick = () => {
    const next = !visible;
    setVisible(next);
    onVisualToggle(stemKey, next);

    // If this is the vocals strip, also update the global flag
    if (stemKey === "vocals") setShowVocals(next);

    if (stemKey === "bass") setShowBass(next);
    if (stemKey === "drums") setShowDrums(next);
  };

  return (
    <div className="channel-strip">
      {/* Stem label */}
      <div className="channel-strip-label">{stemKey.toUpperCase()}</div>

      {/* Vertical volume fader */}
      <div className="volume-fader-container">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="volume-fader"
        />
      </div>

      {/* Control buttons */}
      <div className="button-grid">
        <button
          className={muted ? "active" : ""}
          onClick={() => {
            setMuted(!muted);
            onMuteToggle(stemKey, !muted);
          }}
        >
          MUTE
        </button>
        <button
          className={solo ? "active" : ""}
          onClick={() => {
            setSolo(!solo);
            onSoloToggle(stemKey, !solo);
          }}
        >
          SOLO
        </button>
        <button
          className={!visible ? "active" : ""}
          onClick={handleVisualClick} //WIP, MUST HANDLE ALL STEM VISIBILITY CLICKS
        >
          VISIBLE
        </button>
        <button onClick={() => onEditClick(stemKey)}>EDIT</button>
      </div>
    </div>
  );
}
