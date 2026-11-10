// src/components/AudioControlsView/index.jsx
// One-row transport for the header: play/pause, stop, scrubber, time, volume.
import React, { useEffect } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { PlayPauseButton } from "./UIElements/PlayPauseButton";
import { StopButton } from "./UIElements/StopButton";
import { TransportClock } from "./UIElements/TransportClock";
import { LoopButton } from "./UIElements/LoopButton";
import { BarBeat } from "./UIElements/BarBeat";
import { isTypingTarget } from "../../utils/isTypingTarget";
import "./AudioControlsView.css";

export default function AudioControlsView() {
  const { isPlaying, duration, playAll, pauseAll, stopAll, seekAll, volume, setVolume } = useAudioEngine();   // volume: in the audio context, so a session keeps it

  const handleVolumeChange = (e) => setVolume(parseFloat(e.target.value));

  // Spacebar is always play / pause, wherever focus landed (a word, a button, a
  // slider), except while typing in a text field.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!(e.code === "Space" || e.key === " ")) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      isPlaying ? pauseAll() : playAll();
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
