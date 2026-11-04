// src/components/AudioControlsView/index.jsx
// One-row transport for the header: play/pause, stop, scrubber, time, volume.
import React, { useState, useEffect } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { PlayPauseButton } from "./UIElements/PlayPauseButton";
import { StopButton } from "./UIElements/StopButton";
import { TransportClock } from "./UIElements/TransportClock";
import { LoopButton } from "./UIElements/LoopButton";
import { BarBeat } from "./UIElements/BarBeat";
import "./AudioControlsView.css";

export default function AudioControlsView() {
  const { audioRefs, isPlaying, duration, playAll, pauseAll, stopAll, seekAll } = useAudioEngine();
  const [volume, setVolume] = useState(1.0);

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    Object.values(audioRefs.current).forEach((a) => { a.volume = v; });
  };

  // Spacebar play/pause
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const role = e.target?.getAttribute?.("role");
      const isControl =
        tag === "input" || tag === "textarea" || tag === "select" || tag === "button" ||
        role === "button" || role === "slider" || e.target?.isContentEditable;
      if (isControl) return;
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        isPlaying ? pauseAll() : playAll();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlaying, playAll, pauseAll]);

  return (
    <div className="ac-row" role="region" aria-label="Audio transport">
      <div className="ac-transport">
        <PlayPauseButton isPlaying={isPlaying} onClick={() => (isPlaying ? pauseAll() : playAll())} />
        <StopButton onClick={stopAll} />
        <LoopButton />
      </div>
      <BarBeat />
      <TransportClock duration={duration} onSeek={seekAll} />
      <label className="ac-volume" title="Volume">
        <span className="ac-volume-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M3 9v6h4l5 4V5L7 9H3z" />
            <path d="M16 8a4.5 4.5 0 0 1 0 8" stroke="currentColor" strokeWidth="1.8" fill="none" />
          </svg>
        </span>
        <input
          className="ac-volume-range"
          type="range" min="0" max="1" step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
        />
      </label>
    </div>
  );
}
