// src/components/AudioControlsView/index.jsx
import React, { useState, useEffect } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { PlayPauseButton } from "./UIElements/PlayPauseButton";
import { StopButton } from "./UIElements/StopButton";
import { ScrubSlider } from "./UIElements/ScrubSlider";
import { VolumeControl } from "./UIElements/VolumeControl";
import "./AudioControlsView.css";

function fmtTime(sec = 0) {
  if (!isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

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

  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1.0);

  // ── Time (RAF) ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let rafId;
    const update = () => {
      const t = audioRefs.current.vocals?.currentTime || 0;
      setCurrentTime(t);
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [audioRefs]);

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

        <div className="ac-scrub-row">
          <ScrubSlider
            value={currentTime}
            max={duration || 0}
            onChange={seekAll}
          />
        </div>

        <div className="ac-time-row">
          <span className="ac-time ac-time-current">
            {fmtTime(currentTime)}
          </span>
          <span className="ac-time ac-time-total">{fmtTime(duration)}</span>
        </div>

        <div className="ac-volume">
          <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
        </div>
      </div>
    </div>
  );
}
