// File: src/components/ChannelStrips/ChannelStrip.jsx
import React, { useEffect, useState } from "react";
import "./ChannelStrip.css";
import { useParams } from "../../contexts/ParamsContext";

export function ChannelStrip({
  stemKey,
  audio,
  onEditClick,
  onSoloToggle,
  onMuteToggle,
  onVisualToggle,
  isSolo = false,
  forcedMute, // boolean when another strip is soloed
  effectiveMuted, // <- NEW: source of truth for UI & audio
  initialVolume = 1,
  initialMuted = false,
  initialVisible = true,
}) {
  const [volume, setVolume] = useState(initialVolume);
  const [muted, setMuted] = useState(initialMuted);
  const [visible, setVisible] = useState(initialVisible);

  const { setShowVocals, setShowBass, setShowDrums } = useParams();

  // Volume → element
  useEffect(() => {
    if (audio) audio.volume = volume;
  }, [volume, audio]);

  // Keep UI + element in sync with "effectiveMuted"
  useEffect(() => {
    if (typeof effectiveMuted === "boolean") {
      setMuted(effectiveMuted);
      if (audio) audio.muted = effectiveMuted;
    }
  }, [effectiveMuted, audio]);

  const handleMuteClick = () => {
    const next = !muted;
    setMuted(next); // optimistic UI
    onMuteToggle?.(stemKey, next);
  };

  const handleSoloClick = () => {
    onSoloToggle?.(stemKey, !isSolo);
  };

  const handleVisualClick = () => {
    const next = !visible;
    setVisible(next);
    onVisualToggle?.(stemKey, next);

    if (stemKey === "vocals") setShowVocals?.(next);
    if (stemKey === "bass") setShowBass?.(next);
    if (stemKey === "drums") setShowDrums?.(next);
  };

  return (
    <div className="channel-strip">
      <div className="channel-strip-label">{stemKey.toUpperCase()}</div>

      <div className="button-grid">
        <button className={muted ? "active" : ""} onClick={handleMuteClick}>
          MUTE
        </button>

        <button className={isSolo ? "active" : ""} onClick={handleSoloClick}>
          SOLO
        </button>

        <button
          className={!visible ? "active" : ""}
          onClick={handleVisualClick}
        >
          VISIBLE
        </button>

        <button onClick={() => onEditClick?.(stemKey)}>EDIT</button>
      </div>
    </div>
  );
}
