// App.jsx
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { fetchSongData } from "./utils/fetchSongData";
import { perfMark } from "./utils/perfMarks";

import { AudioProvider, useAudioEngine } from "./contexts/AudioContext";
import { ParamsProvider } from "./contexts/ParamsContext";
import { TapestryLayoutProvider } from "./contexts/TapestryLayoutContext";
import { UIStateProvider } from "./contexts/UIStateContext";

import { SongDataProvider } from "./contexts/SongDataContext";
import { SyllableSelectionProvider } from "./contexts/lyricsContexts/SyllableSelectionContext";
import { WordSelectionProvider } from "./contexts/lyricsContexts/WordSelectionContext";
import { LineSelectionProvider } from "./contexts/lyricsContexts/LineSelectionContext";

import AppShell from "./components/Shell/AppShell";
import AppHeader from "./components/Shell/AppHeader";
import TapestryView from "./components/TapestryView";
import LyricsView from "./components/LyricsView";

// Helper child that binds stopAll into a ref the parent can call.
function StopAllBinder({ bindRef }) {
  const { stopAll } = useAudioEngine();
  useEffect(() => {
    bindRef.current = stopAll;
    return () => {
      bindRef.current = null;
    };
  }, [stopAll, bindRef]);
  return null;
}

function CenteredMessage({ children }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      {children}
    </div>
  );
}

export default function App() {
  const [selectedSong, setSelectedSong] = useState("Amen");
  const [songData, setSongData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Ref where StopAllBinder will drop in the current stopAll()
  const stopAllRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setSongData(null);

    (async () => {
      try {
        perfMark(`song-fetch-start:${selectedSong}`);
        const data = await fetchSongData(selectedSong);
        if (cancelled) return;
        perfMark(`song-data-loaded:${selectedSong}`);
        setSongData(data);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSong]);

  const handleSongChange = (e) => {
    stopAllRef.current?.();
    setSelectedSong(e.target.value);
  };

  // songData is only "ready" once it belongs to the currently selected song
  // (avoids one render with new keys but old data; see perf notes).
  const songReady = !!songData && songData.song === selectedSong;

  if (!songReady || loadError) {
    return (
      <UIStateProvider>
        <AppShell
          header={<AppHeader selectedSong={selectedSong} onSongChange={handleSongChange} transport={false} />}
          left={null}
          center={
            <CenteredMessage>
              {loadError ? (
                <p style={{ color: "crimson" }}>
                  Failed to load <strong>{selectedSong}</strong>: {loadError}
                </p>
              ) : (
                <div>Loading song data…</div>
              )}
            </CenteredMessage>
          }
          right={null}
        />
      </UIStateProvider>
    );
  }

  const { lyricTranscription, drumTranscription, bassTranscription, audio, duration } = songData;

  return (
    <UIStateProvider>
      <ParamsProvider>
        {/* key={selectedSong} ensures a clean re-mount of the audio graph per song */}
        <AudioProvider key={selectedSong} audioFiles={audio}>
          <StopAllBinder bindRef={stopAllRef} />
          <SongDataProvider
            lyricTranscription={lyricTranscription}
            drumTranscription={drumTranscription}
            bassTranscription={bassTranscription}
          >
            <SyllableSelectionProvider key={`syllables-${selectedSong}`} transcriptionData={lyricTranscription}>
              <LineSelectionProvider key={`lines-${selectedSong}`} transcriptionData={lyricTranscription}>
                <WordSelectionProvider key={`words-${selectedSong}`} transcriptionData={lyricTranscription}>
                  <TapestryLayoutProvider
                    key={`layout-${selectedSong}`}
                    duration={duration}
                    estimated_bpm={drumTranscription.estimated_bpm}
                    downbeats={drumTranscription.downbeats}
                    beats={drumTranscription.beats}
                  >
                    <AppShell
                      header={<AppHeader selectedSong={selectedSong} onSongChange={handleSongChange} />}
                      left={<div className="rt-left-placeholder" />}
                      center={<TapestryView key={`tapestry-${selectedSong}`} />}
                      right={<LyricsView key={`lyrics-${selectedSong}`} height="100%" />}
                    />
                  </TapestryLayoutProvider>
                </WordSelectionProvider>
              </LineSelectionProvider>
            </SyllableSelectionProvider>
          </SongDataProvider>
        </AudioProvider>
      </ParamsProvider>
    </UIStateProvider>
  );
}
