// src/contexts/AudioContext.jsx
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const AudioContext = createContext();
// Stable transport controls only (never change identity after mount).
// Components that only need seekAll/subscribePlayhead should read this so
// they do not re-render on every isPlaying/duration change.
const AudioControlsContext = createContext();

export function AudioProvider({ audioFiles, children }) {
  const audioRefs = useRef({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(null);

  // High-frequency playhead time lives OUTSIDE React state.
  const playheadRef = useRef(0);
  const subscribersRef = useRef(new Set());

  // Notify all subscribers with the current playhead time.
  const emitPlayhead = useCallback((t) => {
    playheadRef.current = t;
    subscribersRef.current.forEach((cb) => cb(t));
  }, []);

  /** Subscribe to per-frame playhead updates. Returns an unsubscribe fn. */
  const subscribePlayhead = useCallback((cb) => {
    subscribersRef.current.add(cb);
    cb(playheadRef.current); // prime with current value
    return () => subscribersRef.current.delete(cb);
  }, []);

  /** Read the latest playhead time imperatively (no re-render). */
  const getPlayheadTime = useCallback(() => playheadRef.current, []);

  // Create <audio> elements from passed-in file paths
  useEffect(() => {
    const refs = {};
    for (let [key, src] of Object.entries(audioFiles)) {
      refs[key] = new Audio(src);
    }
    audioRefs.current = refs;

    const onMeta = () => setDuration(refs.vocals?.duration || 0);
    refs.vocals?.addEventListener("loadedmetadata", onMeta);
    return () => refs.vocals?.removeEventListener("loadedmetadata", onMeta);
  }, [audioFiles]);

  // rAF loop: update ref + emit to subscribers. NO setState here.
  useEffect(() => {
    if (!isPlaying) return;
    let frameId;
    const tick = () => {
      const current = audioRefs.current.vocals?.currentTime || 0;
      emitPlayhead(current);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, emitPlayhead]);

  // Controls
  const playAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((a) => a.play());
    setIsPlaying(true);
  }, []);

  const pauseAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((a) => a.pause());
    setIsPlaying(false);
  }, []);

  const stopAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    setIsPlaying(false);
    emitPlayhead(0);
  }, [emitPlayhead]);

  const seekAll = useCallback(
    (time) => {
      Object.values(audioRefs.current).forEach((a) => {
        a.currentTime = time;
      });
      emitPlayhead(time);
    },
    [emitPlayhead]
  );

  // Memoized value — identity now changes only on isPlaying/duration changes,
  // NOT every frame. (All functions are stable via useCallback.)
  const value = useMemo(
    () => ({
      audioRefs,
      isPlaying,
      duration,
      playAll,
      pauseAll,
      stopAll,
      seekAll,
      subscribePlayhead,
      getPlayheadTime,
    }),
    [
      isPlaying,
      duration,
      playAll,
      pauseAll,
      stopAll,
      seekAll,
      subscribePlayhead,
      getPlayheadTime,
    ]
  );

  const controls = useMemo(
    () => ({
      playAll,
      pauseAll,
      stopAll,
      seekAll,
      subscribePlayhead,
      getPlayheadTime,
    }),
    [playAll, pauseAll, stopAll, seekAll, subscribePlayhead, getPlayheadTime]
  );

  return (
    <AudioControlsContext.Provider value={controls}>
      <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
    </AudioControlsContext.Provider>
  );
}

/** Stable transport controls (seekAll etc.); no re-render on play/pause. */
export function useAudioControls() {
  return useContext(AudioControlsContext);
}

export function useAudioEngine() {
  return useContext(AudioContext);
}

/**
 * Subscribe to per-frame playhead time and run an imperative callback.
 * The callback does NOT trigger React re-renders — use it to mutate refs/DOM.
 * The latest `cb` is always invoked, so inline callbacks are safe (no deps needed).
 */
export function usePlayheadSubscription(cb) {
  const { subscribePlayhead } = useAudioControls();
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(
    () => subscribePlayhead((t) => cbRef.current(t)),
    [subscribePlayhead]
  );
}
