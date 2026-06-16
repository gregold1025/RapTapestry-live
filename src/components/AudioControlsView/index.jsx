// src/components/AudioControlsView/index.jsx
import React, { useState, useEffect } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { PlayPauseButton } from "./UIElements/PlayPauseButton";
import { StopButton } from "./UIElements/StopButton";
import { VolumeControl } from "./UIElements/VolumeControl";
import { TransportClock } from "./UIElements/TransportClock";
import "./AudioControlsView.css";

export default function AudioControlsView() {
  const {
    audioRefs,
    isPlaying,
    duration,
    playAll,
    pauseAll,
    stopAll,
    seekAll,
  } = useAudioEngine();

  const [volume, setVolume] = useState(1.0);

  // ── Volume ────────────────────────────────────────────────────────────────
  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    Object.values(audioRefs.current).forEach((a) => {
      a.volume = newVol;
    });
  };

  // ── Spacebar play/pause ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (isTyping) return;

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        isPlaying ? pauseAll() : playAll();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlaying, playAll, pauseAll]);

  return (
    <div
      className="audio-controls-panel"
      role="region"
      aria-label="Audio transport"
    >
      {/* Optional header label (no drag, no minimize) */}
      <div className="ac-header"></div>

      <div className="audio-controls">
        <div className="ac-transport">
          <PlayPauseButton
            isPlaying={isPlaying}
            onClick={() => (isPlaying ? pauseAll() : playAll())}
          />
          <StopButton onClick={stopAll} />
        </div>

        <TransportClock duration={duration} onSeek={seekAll} />

        <div className="ac-volume">
          <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
        </div>
      </div>
    </div>
  );
}
