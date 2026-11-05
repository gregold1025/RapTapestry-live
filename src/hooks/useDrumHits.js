// src/hooks/useDrumHits.js
// The drum hits every drum view draws: the stem's onsets (with their band),
// each named by the classifier at the current threshold multiplier.
import { useMemo } from "react";
import { useSongData } from "../contexts/SongDataContext";
import { useParams } from "../contexts/ParamsContext";
import { nameOnsets } from "../utils/drumClasses";

export function useDrumHits() {
  const { drumTranscription, drumClassesTranscription } = useSongData();
  const { drumThreshold } = useParams();
  return useMemo(() => {
    const onsets = (drumTranscription?.drum_hits ?? []).filter((h) => h && Number.isFinite(h.time)).sort((a, b) => a.time - b.time);
    if (!drumClassesTranscription?.hits) return onsets.map((o) => ({ ...o, cls: "other", conf: null }));
    return nameOnsets(onsets, drumClassesTranscription.hits, drumClassesTranscription.thresholds, drumThreshold);
  }, [drumTranscription, drumClassesTranscription, drumThreshold]);
}
