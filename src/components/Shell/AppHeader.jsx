// src/components/Shell/AppHeader.jsx
import React from "react";
import { useUIState } from "../../contexts/UIStateContext";
import AudioControlsView from "../AudioControlsView";
import StemsStrip from "./StemsStrip";

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
const IconMagnifier = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.4" />
    <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const VIEWS = [
  { id: "lyrics", title: "Lyrics", Icon: IconLyrics },
  { id: "queries", title: "Query list", Icon: IconList },
  { id: "query", title: "Single query", Icon: IconMagnifier },
];

function RightViewSelector() {
  const { rightView, setRightView } = useUIState();
  return (
    <div className="rt-header-group">
      <div className="rt-seg rt-seg--icons" role="group" aria-label="Right view">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={rightView === v.id ? "is-active" : ""}
            aria-pressed={rightView === v.id}
            onClick={() => setRightView(v.id)}
            title={v.title}
          >
            <v.Icon />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AppHeader({ selectedSong, onSongChange, transport = true }) {
  return (
    <>
      {/* left: the global stems panel (eye / M / S; name opens the stem's panel) */}
      <div className="rt-header-left">
        <StemsStrip mix={transport} />
      </div>

      {/* center: song on top, transport underneath */}
      <div className="rt-header-center">
        <select
          className="rt-song-select"
          value={selectedSong}
          onChange={onSongChange}
          aria-label="Song"
          title="Song"
        >
          {SONGS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <div className="rt-header-transport">{transport ? <AudioControlsView /> : null}</div>
      </div>

      {/* right: which view fills the right pane */}
      <div className="rt-header-right">
        <RightViewSelector />
      </div>
    </>
  );
}
