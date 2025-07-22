import React, { useState, useEffect } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { PlayPauseButton } from "./UIElements/PlayPauseButton";
import { StopButton } from "./UIElements/StopButton";
import { ScrubSlider } from "./UIElements/ScrubSlider";
import { VolumeControl } from "./UIElements/VolumeControl";

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px",
        position: "relative",
      }}
    >
      <PlayPauseButton
        isPlaying={isPlaying}
        onClick={() => (isPlaying ? pauseAll() : playAll())}
      />
      <StopButton onClick={stopAll} />
      <ScrubSlider
        value={currentTime}
        max={duration}
        onChange={seekAll}
        style={{ flex: 1 }}
      />
      <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
    </div>
  );
}
