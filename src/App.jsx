import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { fetchSongData } from "./utils/fetchSongData";

import { AudioProvider } from "./contexts/AudioContext";
import { ParamsProvider } from "./contexts/ParamsContext";
import { TapestryLayoutProvider } from "./contexts/TapestryLayoutContext";

import { SyllableSelectionProvider } from "./contexts/lyricsContexts/SyllableSelectionContext";
import { WordSelectionProvider } from "./contexts/lyricsContexts/WordSelectionContext";
import { LineSelectionProvider } from "./contexts/lyricsContexts/LineSelectionContext";

import AudioControlsView from "./components/AudioControlsView";
import LyricsView from "./components/LyricsView";
import TapestryView from "./components/TapestryView";
import ChannelStripsPanel from "./components/ChannelStripView";

export default function App() {
  const [selectedSong, setSelectedSong] = useState("Amen");
  const [songData, setSongData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // If you end up needing it again later:
  const tapestryContainerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const token = Symbol("song-load"); // prevents late setState from older requests
    setLoading(true);
    setLoadError(null);
    // Optional: clear old data to force a clean "Loading…" during swap
    setSongData(null);

    (async () => {
      try {
        const data = await fetchSongData(selectedSong);
        if (cancelled) return;
        // Only accept the latest request
        setSongData(data);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSong]);

  if (loading && !songData) {
    return (
      <div className="app-container">
        <header className="header">
          <select
            value={selectedSong}
            onChange={(e) => setSelectedSong(e.target.value)}
          >
            <option value="93Til">93 Til Infinity - Souls of Mischief</option>
            <option value="Amen">Amen - Nappy Nina</option>
            <option value="RhymesLikeDimes">Rhymes Like Dimes - MF DOOM</option>
          </select>
        </header>
        <main
          className="main-content"
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <div>Loading song data…</div>
        </main>
        <footer className="footer">Footer</footer>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-container">
        <header className="header">
          <select
            value={selectedSong}
            onChange={(e) => setSelectedSong(e.target.value)}
          >
            <option value="93Til">93 Til Infinity - Souls of Mischief</option>
            <option value="Amen">Amen - Nappy Nina</option>
            <option value="RhymesLikeDimes">Rhymes Like Dimes - MF DOOM</option>
          </select>
        </header>
        <main className="main-content" style={{ padding: 16 }}>
          <p style={{ color: "crimson" }}>
            Failed to load <strong>{selectedSong}</strong>: {loadError}
          </p>
        </main>
        <footer className="footer">Footer</footer>
      </div>
    );
  }

  if (!songData) return null; // defensive (shouldn’t hit unless both null and not loading)

  const {
    lyricTranscription,
    drumTranscription,
    bassTranscription,
    audio,
    midi,
    duration,
  } = songData;

  return (
    <ParamsProvider>
      {/* key={selectedSong} ensures a clean re-mount of the audio graph per song */}
      <AudioProvider key={selectedSong} audioFiles={audio}>
        <SyllableSelectionProvider transcriptionData={lyricTranscription}>
          {/* re-mount rhyme/line/word contexts on song change */}
          <LineSelectionProvider
            key={`lines-${selectedSong}`}
            transcriptionData={lyricTranscription}
          >
            <WordSelectionProvider
              key={`words-${selectedSong}`}
              transcriptionData={lyricTranscription}
            >
              <div className="app-container">
                <header className="header">
                  <select
                    value={selectedSong}
                    onChange={(e) => setSelectedSong(e.target.value)}
                  >
                    <option value="93Til">
                      93 Til Infinity - Souls of Mischief
                    </option>
                    <option value="Amen">Amen - Nappy Nina</option>
                    <option value="RhymesLikeDimes">
                      Rhymes Like Dimes - MF DOOM
                    </option>
                  </select>
                </header>

                <main className="main-content">
                  <div className="left-pane">
                    {/* re-mount layout + view so visual playhead/grid fully reset */}
                    <TapestryLayoutProvider
                      key={`layout-${selectedSong}`}
                      duration={duration}
                      estimated_bpm={drumTranscription.estimated_bpm}
                      downbeats={drumTranscription.downbeats}
                      barsPerRow={8}
                    >
                      <TapestryView
                        key={`tapestry-${selectedSong}`}
                        lyricTranscription={lyricTranscription}
                        drumTranscription={drumTranscription}
                        bassTranscription={bassTranscription}
                      />
                    </TapestryLayoutProvider>
                  </div>

                  <div className="right-pane">
                    <div className="right-pane-section lyrics">
                      <LyricsView
                        key={`lyrics-${selectedSong}`}
                        transcriptionData={lyricTranscription}
                        height="100%"
                      />
                    </div>
                    <div className="right-pane-section channel">
                      <ChannelStripsPanel />
                    </div>
                    <div className="right-pane-section audio">
                      <AudioControlsView />
                    </div>
                  </div>
                </main>

                <footer className="footer">Footer</footer>
              </div>
            </WordSelectionProvider>
          </LineSelectionProvider>
        </SyllableSelectionProvider>
      </AudioProvider>
    </ParamsProvider>
  );
}
