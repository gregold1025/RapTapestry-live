// src/contexts/SongDataContext.jsx
// Holds the loaded transcriptions for the current song plus two derived models:
//   songModel  - the typed rhyme engine's view of the song (dictionary phones, beat grid)
//   timing     - per-word syllable onsets and F0 from the measured dataset (fallbacks inside)
import React, { createContext, useContext, useMemo } from "react";
import { centroidRange } from "../utils/laneLayout";
import { buildTiming } from "../utils/timingModel";
import { buildSongModel } from "../engine";

const SongDataContext = createContext(null);

export function SongDataProvider({
  children,
  songId,
  lyricTranscription,
  drumTranscription,
  bassTranscription,
  measuredTranscription = null,
  drumClassesTranscription = null,
}) {
  const centroidSpan = useMemo(() => centroidRange(lyricTranscription), [lyricTranscription]);
  const songModel = useMemo(
    () => (lyricTranscription && drumTranscription ? buildSongModel({ songId, lyricTranscription, drumTranscription }) : null),
    [songId, lyricTranscription, drumTranscription]
  );
  const timing = useMemo(() => buildTiming(lyricTranscription, measuredTranscription), [lyricTranscription, measuredTranscription]);

  const value = useMemo(
    () => ({ songId, lyricTranscription, drumTranscription, bassTranscription, measuredTranscription, drumClassesTranscription, centroidSpan, songModel, timing }),
    [songId, lyricTranscription, drumTranscription, bassTranscription, measuredTranscription, drumClassesTranscription, centroidSpan, songModel, timing]
  );

  return <SongDataContext.Provider value={value}>{children}</SongDataContext.Provider>;
}

export function useSongData() {
  const ctx = useContext(SongDataContext);
  if (!ctx) throw new Error("useSongData must be used within a SongDataProvider");
  return ctx;
}
