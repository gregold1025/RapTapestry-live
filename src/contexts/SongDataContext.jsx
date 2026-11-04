// src/contexts/SongDataContext.jsx
// Holds the loaded transcription data for the current song.
// Eliminates prop-drilling of lyricTranscription, drumTranscription,
// and bassTranscription through TapestryView -> TapestrySVG -> individual glyphs.

import React, { createContext, useContext, useMemo } from "react";
import { centroidRange } from "../utils/laneLayout";

const SongDataContext = createContext(null);

export function SongDataProvider({
  children,
  lyricTranscription,
  drumTranscription,
  bassTranscription,
}) {
  // Song-wide centroid spread (5th..95th percentile) used by pitched layers.
  const centroidSpan = useMemo(() => centroidRange(lyricTranscription), [lyricTranscription]);
  const value = useMemo(
    () => ({ lyricTranscription, drumTranscription, bassTranscription, centroidSpan }),
    [lyricTranscription, drumTranscription, bassTranscription, centroidSpan]
  );

  return (
    <SongDataContext.Provider value={value}>
      {children}
    </SongDataContext.Provider>
  );
}

export function useSongData() {
  const ctx = useContext(SongDataContext);
  if (!ctx) {
    throw new Error("useSongData must be used within a SongDataProvider");
  }
  return ctx;
}
