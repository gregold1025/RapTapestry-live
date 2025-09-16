import React, { useState, useEffect } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { PlayPauseButton } from "./UIElements/PlayPauseButton";
import { StopButton } from "./UIElements/StopButton";
import { ScrubSlider } from "./UIElements/ScrubSlider";
import { VolumeControl } from "./UIElements/VolumeControl";
import "./AudioControlsView.css"; // ← NEW

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

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    Object.values(audioRefs.current).forEach((a) => {
      a.volume = newVol;
    });
  };

  return (
    <div className="audio-controls">
      <PlayPauseButton
        isPlaying={isPlaying}
        onClick={() => (isPlaying ? pauseAll() : playAll())}
      />
      <StopButton onClick={stopAll} />

      {/* If ScrubSlider renders an <input type="range"> it will pick up the scoped styles. */}
      <div className="scrub-wrap">
        <ScrubSlider value={currentTime} max={duration} onChange={seekAll} />
      </div>

      {/* If you ONLY want the big style on the volume slider, 
          add a class prop (if VolumeControl supports it) like className="volume-range"
          and use the ".audio-controls .volume-range" block below. */}
      <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
    </div>
  );
}
