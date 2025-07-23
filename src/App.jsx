import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { fetchSongData } from "./utils/fetchSongData";

import { AudioProvider } from "./contexts/AudioContext";
import { ParamsProvider } from "./contexts/ParamsContext";
import { TapestryLayoutProvider } from "./contexts/TapestryLayoutContext";

import { SyllableSelectionProvider } from "./contexts/SyllableSelectionContext";
import { WordSelectionProvider } from "./contexts/WordSelectionContext";
import { LineSelectionProvider } from "./contexts/LineSelectionContext";

import AudioControlsView from "./components/AudioControlsView";
import LyricsView from "./components/LyricsView";
import TapestryView from "./components/TapestryView";
import ChannelStripsPanel from "./components/ChannelStripView";

export default function App() {
  const [selectedSong, setSelectedSong] = useState("93Til");
  const [songData, setSongData] = useState(null);
  const tapestryContainerRef = useRef(null); // ✅ Shared between context + view

  useEffect(() => {
    async function loadData() {
      const data = await fetchSongData(selectedSong);
      setSongData(data);
    }
    loadData();
  }, [selectedSong]);

  if (!songData) return <div>Loading song data...</div>;

  const { transcriptionData, audio, midi } = songData;

  return (
    <ParamsProvider>
      <AudioProvider audioFiles={audio}>
        <SyllableSelectionProvider transcriptionData={transcriptionData}>
          <LineSelectionProvider>
            <WordSelectionProvider transcriptionData={transcriptionData}>
              <div className="app-container">
                <header className="header">
                  <select
                    value={selectedSong}
                    onChange={(e) => setSelectedSong(e.target.value)}
                  >
                    <option value="93Til">93Til</option>
                  </select>
                </header>

                <main className="main-content">
                  <div className="left-pane">
                    <TapestryLayoutProvider
                      transcriptionData={transcriptionData}
                    >
                      <TapestryView transcription={transcriptionData} />
                    </TapestryLayoutProvider>
                  </div>

                  <div className="right-pane">
                    <div className="right-pane-section lyrics">
                      <LyricsView
                        transcriptionData={transcriptionData}
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
