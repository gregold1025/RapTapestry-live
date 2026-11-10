// src/contexts/StemMixContext.jsx
// Shared mute / solo / visible per stem. Mute and solo drive the <audio>
// elements (one shared playhead), visibility drives the tapestry layers.
import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { useAudioEngine } from "./AudioContext";
import { useParams } from "./ParamsContext";
import { stemMixReducer, initialStemMix, effectiveMutedOf, STEMS } from "./stemMixReducer";

const StemMixContext = createContext(null);

export function StemMixProvider({ children }) {
  const [state, dispatch] = useReducer(stemMixReducer, initialStemMix);
  const { audioRefs } = useAudioEngine();
  const { setShowVocals, setShowDrums, setShowBass } = useParams();

  const effectiveMuted = useMemo(() => effectiveMutedOf(state), [state]);

  // Push mute state into the audio elements.
  useEffect(() => {
    const refs = audioRefs.current || {};
    for (const s of STEMS) {
      if (refs[s]) refs[s].muted = !!effectiveMuted[s];
    }
  }, [effectiveMuted, audioRefs]);

  // Mirror visibility into the params the glyph layers already read.
  useEffect(() => { setShowVocals?.(state.visible.vocals); }, [state.visible.vocals, setShowVocals]);
  useEffect(() => { setShowDrums?.(state.visible.drums); }, [state.visible.drums, setShowDrums]);
  useEffect(() => { setShowBass?.(state.visible.bass); }, [state.visible.bass, setShowBass]);

  const value = useMemo(
    () => ({
      muted: state.muted,
      soloed: state.soloed,
      visible: state.visible,
      effectiveMuted,
      toggleMute: (stem) => dispatch({ type: "toggleMute", stem }),
      toggleSolo: (stem) => dispatch({ type: "toggleSolo", stem }),
      setVisible: (stem, visible) => dispatch({ type: "setVisible", stem, visible }),
      // sessions (Greg 2026-11-09)
      getMixSnapshot: () => ({ muted: state.muted, soloed: state.soloed, visible: state.visible }),
      applyMixSnapshot: (mix) => dispatch({ type: "restore", state: mix }),
    }),
    [state, effectiveMuted]
  );

  return <StemMixContext.Provider value={value}>{children}</StemMixContext.Provider>;
}

export function useStemMix() {
  const ctx = useContext(StemMixContext);
  if (!ctx) throw new Error("useStemMix must be used within a StemMixProvider");
  return ctx;
}
