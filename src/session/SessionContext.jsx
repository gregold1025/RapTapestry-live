// src/session/SessionContext.jsx
// Saving and loading a session (Greg 2026-11-09). SessionProvider sits inside the parameters and
// the UI state, which live above the song, so it can apply them at once. Queries, the stem mix,
// the loop and the audio are mounted per song: a SessionBridge inside them reports their state
// for a save and applies a pending session once its song has loaded (shouldApply). The playhead
// always starts at 0; `epoch` remounts the Line Staff and the clock so they start in Follow.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "../contexts/ParamsContext";
import { useUIState } from "../contexts/UIStateContext";
import { useAudioEngine } from "../contexts/AudioContext";
import { useStemMix } from "../contexts/StemMixContext";
import { useQueryActions } from "../contexts/QueryContext";
import { buildSessionFile, parseSessionFile, sessionFileName } from "./sessionFile";
import { loadPlan, shouldApply } from "./loadPlan";

const SessionContext = createContext(null);
const NO_LOOP = { on: false, start: 0, end: 0 };

export function SessionProvider({ currentSong, songs, onSwitchSong, children }) {
  const { getParamsSnapshot, applyParamsSnapshot, assetNameOf, assetUrlOf } = useParams();
  const { getUISnapshot, applyUISnapshot } = useUIState();
  const [pending, setPending] = useState(null);   // { ...session, notes, applied }
  const [status, setStatus] = useState(null);     // { text, error? }
  const [epoch, setEpoch] = useState(0);
  const bridgeRef = useRef(null);                 // the mounted song's { song, snapshot(), rewind() }

  const saveSession = useCallback(() => {
    const b = bridgeRef.current;
    if (!b) return;
    const now = new Date();
    const text = buildSessionFile({ song: b.song, params: getParamsSnapshot(), ui: getUISnapshot(), ...b.snapshot() }, { now, assetNameOf });
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = sessionFileName(b.song, now);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatus({ text: `Saved ${a.download}` });
  }, [getParamsSnapshot, getUISnapshot, assetNameOf]);

  /** Load a session file's text; a bad file applies nothing and says why. */
  const loadSessionText = useCallback((text) => {
    const r = parseSessionFile(text, { assetUrlOf });
    if (!r.ok) { setStatus({ text: r.error, error: true }); return false; }
    if (songs && !songs.includes(r.session.song)) { setStatus({ text: `This session is for "${r.session.song}", a song this app does not have.`, error: true }); return false; }
    applyParamsSnapshot(r.session.params);
    applyUISnapshot(r.session.ui);
    setPending({ ...r.session, notes: r.notes, applied: false });
    setEpoch((e) => e + 1);
    if (loadPlan(currentSong, r.session).switchSong) onSwitchSong(r.session.song);
    else bridgeRef.current?.rewind();
    return true;
  }, [assetUrlOf, songs, applyParamsSnapshot, applyUISnapshot, currentSong, onSwitchSong]);

  const markApplied = useCallback((text) => {
    setPending((p) => (p ? { ...p, applied: true } : p));
    setStatus({ text });
  }, []);

  const value = useMemo(
    () => ({ saveSession, loadSessionText, status, setStatus, epoch, pending, markApplied, bridgeRef }),
    [saveSession, loadSessionText, status, epoch, pending, markApplied]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

/** Mounted inside the per-song providers: reports their state, applies a pending session once. */
export function SessionBridge({ songId }) {
  const { pending, markApplied, bridgeRef } = useSession();
  const { getQuerySnapshot, applyQuerySnapshot } = useQueryActions();
  const mix = useStemMix();
  const { loop, setLoop, volume, setVolume, stopAll } = useAudioEngine();
  const live = useRef(null);
  live.current = { mix, loop, volume };

  useEffect(() => {
    bridgeRef.current = {
      song: songId,
      snapshot: () => ({ queries: getQuerySnapshot(), mix: { ...live.current.mix.getMixSnapshot(), volume: live.current.volume }, loop: live.current.loop }),
      rewind: () => stopAll(),
    };
    return () => { if (bridgeRef.current?.song === songId) bridgeRef.current = null; };
  }, [bridgeRef, songId, getQuerySnapshot, stopAll]);

  useEffect(() => {
    if (!shouldApply(pending, songId)) return;
    stopAll();
    const { dropped } = applyQuerySnapshot(pending.queries);
    live.current.mix.applyMixSnapshot(pending.mix);
    setVolume(pending.mix?.volume ?? 1);
    setLoop(pending.loop ? { ...NO_LOOP, ...pending.loop } : NO_LOOP);
    const notes = [...(pending.notes ?? [])];
    if (dropped) notes.push(dropped === 1 ? "1 query no longer fits this song and was left out" : `${dropped} queries no longer fit this song and were left out`);
    markApplied(`Loaded ${songId} session${notes.length ? ` (${notes.join("; ")})` : ""}`);
  }, [pending, songId, applyQuerySnapshot, setVolume, setLoop, stopAll, markApplied]);

  return null;
}
