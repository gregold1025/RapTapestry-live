// src/components/Shell/AppHeader.jsx
// Left: the lyrics toggle (ABC). Center: the song above the transport (play,
// stop, loop, bar.beat, scrubber, time) and the Line Staff toggle (treble
// clef). Right: parameters | queries for the right pane.
import React from "react";
import { useUIState } from "../../contexts/UIStateContext";
import AudioControlsView from "../AudioControlsView";

export const SONGS = [
  { id: "93Til", label: "93 Til Infinity — Souls of Mischief" },
  { id: "Amen", label: "Amen — Nappy Nina" },
  { id: "RhymesLikeDimes", label: "Rhymes Like Dimes — MF DOOM" },
  { id: "Unemployed", label: "Unemployed — Tierra Whack" },
];

const IconLyrics = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <text x="2" y="17" fontSize="12" fontWeight="700" fill="currentColor" fontFamily="inherit">ABC</text>
  </svg>
);
const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);
const IconSliders = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 4v16M17 4v16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="7" cy="9" r="2.6" fill="currentColor" />
    <circle cx="17" cy="15" r="2.6" fill="currentColor" />
  </svg>
);
export const IconClef = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M11 22c-1.5 0-2.5-1-2.5-2.2 0-1.1.9-1.9 1.9-1.9.9 0 1.6.6 1.6 1.4 0 .7-.5 1.2-1.1 1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12.5 2.5c1.6 1.6 2.4 3.6 1.1 5.9-1.4 2.4-5.3 4.5-5.3 8.1 0 2.1 1.7 3.6 3.9 3.6 2 0 3.3-1.3 3.3-3 0-1.6-1.2-2.8-2.8-2.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12.5 2.5 11.2 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export default function AppHeader({ selectedSong, onSongChange, transport = true }) {
  const { lyricsOpen, toggleLyrics, rightView, rightOpen, toggleRightView, staffOpen, toggleStaff } = useUIState();
  return (
    <>
      <div className="rt-header-left">
        <button type="button" className={`rt-tog ${lyricsOpen ? "is-active" : ""}`} aria-pressed={lyricsOpen} onClick={toggleLyrics} title={lyricsOpen ? "Hide the lyrics" : "Show the lyrics"}>
          <IconLyrics />
        </button>
      </div>

      <div className="rt-header-center">
        <select className="rt-song-select" value={selectedSong} onChange={onSongChange} aria-label="Song" title="Song">
          {SONGS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <div className="rt-header-transport">
          {transport ? <AudioControlsView /> : null}
          <button type="button" className={`rt-tog ${staffOpen ? "is-active" : ""}`} aria-pressed={staffOpen} onClick={toggleStaff} title={staffOpen ? "Close the Line Staff" : "Open the Line Staff under the tapestry"} disabled={!transport}>
            <IconClef />
          </button>
        </div>
      </div>

      <div className="rt-header-right">
        <div className="rt-seg rt-seg--icons" role="group" aria-label="Right pane">
          <button type="button" className={rightOpen && rightView === "params" ? "is-active" : ""} aria-pressed={rightOpen && rightView === "params"} onClick={() => toggleRightView("params")} title={rightOpen && rightView === "params" ? "Hide the parameters" : "Parameters"}><IconSliders /></button>
          <button type="button" className={rightOpen && rightView === "queries" ? "is-active" : ""} aria-pressed={rightOpen && rightView === "queries"} onClick={() => toggleRightView("queries")} title={rightOpen && rightView === "queries" ? "Hide the queries" : "Queries"}><IconList /></button>
        </div>
      </div>
    </>
  );
}
