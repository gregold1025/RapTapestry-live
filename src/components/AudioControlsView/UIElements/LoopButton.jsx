// Loop toggle (Logic-style): on first use the loop spans the four bars from
// the bar under the playhead; drag the handles on the tapestry to change it.
import React from "react";
import { useAudioEngine } from "../../../contexts/AudioContext";
import { useSongData } from "../../../contexts/SongDataContext";
import { defaultLoop } from "../../../utils/loop";

export function LoopButton() {
  const { loop, setLoop, getPlayheadTime } = useAudioEngine();
  const { songModel } = useSongData();
  const toggle = () => {
    setLoop((prev) => {
      if (prev.on) return { ...prev, on: false };
      const range = prev.end > prev.start ? { start: prev.start, end: prev.end } : (songModel ? defaultLoop(getPlayheadTime(), songModel) : { start: 0, end: 0 });
      return { on: true, ...range };
    });
  };
  return (
    <button type="button" className={`ac-btn ac-loop ${loop.on ? "is-on" : ""}`} aria-pressed={loop.on} onClick={toggle} title={loop.on ? "Loop on: play starts at the loop start; drag the handles on the tapestry. Click to turn off." : "Loop a section of the song"}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
        <path d="M17 7H8a4 4 0 0 0 0 8h1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7 17h9a4 4 0 0 0 0-8h-1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="m15 4 3 3-3 3M9 14l-3 3 3 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
