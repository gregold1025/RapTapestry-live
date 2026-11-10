// App.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { fetchSongData } from "./utils/fetchSongData";
import { perfMark } from "./utils/perfMarks";

import { AudioProvider, useAudioEngine } from "./contexts/AudioContext";
import { ParamsProvider } from "./contexts/ParamsContext";
import { TapestryLayoutProvider } from "./contexts/TapestryLayoutContext";
import { UIStateProvider } from "./contexts/UIStateContext";
import { StemMixProvider } from "./contexts/StemMixContext";

import { SongDataProvider } from "./contexts/SongDataContext";
import { QueryProvider } from "./contexts/QueryContext";
import { SessionProvider, SessionBridge } from "./session/SessionContext";
import { SONGS } from "./components/Shell/AppHeader";

import AppShell from "./components/Shell/AppShell";
import AppHeader from "./components/Shell/AppHeader";
import CenterStage from "./components/CenterStage";
import RightPane from "./components/RightPane/RightPane";
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

const SONG_IDS = SONGS.map((s) => s.id);

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

  const switchSong = useCallback((song) => {
    stopAllRef.current?.();
    setSelectedSong(song);
  }, []);
  const handleSongChange = (e) => switchSong(e.target.value);
  // sessions (Greg 2026-11-09): the provider sits at the same place in both trees below, so a
  // pending session survives the song switch it asks for
  const session = (children) => (
    <SessionProvider currentSong={selectedSong} songs={SONG_IDS} onSwitchSong={switchSong}>{children}</SessionProvider>
  );

  // songData is only "ready" once it belongs to the currently selected song
  // (avoids one render with new keys but old data; see perf notes).
  const songReady = !!songData && songData.song === selectedSong;

  // UIStateProvider and ParamsProvider stay mounted across song loads so the
  // header selectors and every panel parameter survive a song switch.
  const loading = (
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
  );

  if (!songReady || loadError) {
    return (
      <UIStateProvider>
        <ParamsProvider>{session(loading)}</ParamsProvider>
      </UIStateProvider>
    );
  }

  const { lyricTranscription, drumTranscription, bassTranscription, measuredTranscription, drumClassesTranscription, bassNotes, audio, duration } = songData;

  return (
    <UIStateProvider>
      <ParamsProvider>
        {session(
        /* key={selectedSong} ensures a clean re-mount of the audio graph per song */
        <AudioProvider key={selectedSong} audioFiles={audio}>
          <StopAllBinder bindRef={stopAllRef} />
          <StemMixProvider>
          <SongDataProvider
            songId={selectedSong}
            lyricTranscription={lyricTranscription}
            drumTranscription={drumTranscription}
            bassTranscription={bassTranscription}
            measuredTranscription={measuredTranscription}
            drumClassesTranscription={drumClassesTranscription}
            bassNotes={bassNotes}
          >
            <QueryProvider key={`queries-${selectedSong}`}>
                  <SessionBridge songId={selectedSong} />
                  <TapestryLayoutProvider
                    key={`layout-${selectedSong}`}
                    duration={duration}
                    estimated_bpm={drumTranscription.estimated_bpm}
                    downbeats={drumTranscription.downbeats}
                    beats={drumTranscription.beats}
                  >
                    <AppShell
                      header={<AppHeader selectedSong={selectedSong} onSongChange={handleSongChange} />}
                      left={<LyricsView key={`lyrics-${selectedSong}`} height="100%" />}
                      center={<CenterStage songKey={selectedSong} duration={duration} />}
                      right={<RightPane />}
                    />
                  </TapestryLayoutProvider>
            </QueryProvider>
          </SongDataProvider>
          </StemMixProvider>
        </AudioProvider>
        )}
      </ParamsProvider>
    </UIStateProvider>
  );
}
