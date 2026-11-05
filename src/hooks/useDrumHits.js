// src/hooks/useDrumHits.js
// The drum hits every drum view draws: the stem's onsets (with their band),
// each named by the classifier at the current threshold multiplier.
import { useMemo } from "react";
import { useSongData } from "../contexts/SongDataContext";
import { useParams } from "../contexts/ParamsContext";
import { nameOnsets } from "../utils/drumClasses";

/** True when the song has classifier output and Classes detection is on. */
export function useByClass() {
  const { drumClassesTranscription } = useSongData();
  const { drumDetection } = useParams();
  return drumDetection === "classes" && !!drumClassesTranscription?.hits;
}

/** { onsets: one per stem onset (bands), named: one per (onset, class) (classes) }. */
export function useDrumHitSets() {
  const { drumTranscription, drumClassesTranscription } = useSongData();
  const { drumThreshold } = useParams();
  return useMemo(() => {
    const onsets = (drumTranscription?.drum_hits ?? []).filter((h) => h && Number.isFinite(h.time)).sort((a, b) => a.time - b.time);
    const named = drumClassesTranscription?.hits
      ? nameOnsets(onsets, drumClassesTranscription.hits, drumClassesTranscription.thresholds, drumThreshold)
      : onsets.map((o) => ({ ...o, cls: "other", conf: null }));
    return { onsets, named };
  }, [drumTranscription, drumClassesTranscription, drumThreshold]);
}

/** The marks the drum layer draws in the current detection mode. */
export function useDrumHits() {
  const { onsets, named } = useDrumHitSets();
  return useByClass() ? named : onsets;
}
