// src/contexts/SongDataContext.jsx
// Holds the loaded transcription data for the current song.
// Eliminates prop-drilling of lyricTranscription, drumTranscription,
// and bassTranscription through TapestryView -> TapestrySVG -> individual glyphs.

import React, { createContext, useContext, useMemo } from "react";

const SongDataContext = createContext(null);

export function SongDataProvider({
  children,
  lyricTranscription,
  drumTranscription,
  bassTranscription,
}) {
  const value = useMemo(
    () => ({ lyricTranscription, drumTranscription, bassTranscription }),
    [lyricTranscription, drumTranscription, bassTranscription]
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
