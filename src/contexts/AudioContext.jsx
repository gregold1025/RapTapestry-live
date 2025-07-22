// src/contexts/AudioContext.jsx
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";

const AudioContext = createContext();

export function AudioProvider({ audioFiles, children }) {
  const audioRefs = useRef({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [duration, setDuration] = useState(null);

  // Create <audio> elements from passed-in file paths
  useEffect(() => {
    const refs = {};
    for (let [key, src] of Object.entries(audioFiles)) {
      refs[key] = new Audio(src);
    }
    audioRefs.current = refs;

    // Set duration from any one of the stems
    const onMeta = () => setDuration(refs.vocals?.duration || 0);
    refs.vocals?.addEventListener("loadedmetadata", onMeta);
    return () => refs.vocals?.removeEventListener("loadedmetadata", onMeta);
  }, [audioFiles]);

  // Track playhead time while playing
  useEffect(() => {
    let frameId;
    const tick = () => {
      const current = audioRefs.current.vocals?.currentTime || 0;
      setPlayheadTime(current);
      frameId = requestAnimationFrame(tick);
    };
    if (isPlaying) frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

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
    setPlayheadTime(0);
  }, []);

  const seekAll = useCallback((time) => {
    Object.values(audioRefs.current).forEach((a) => {
      a.currentTime = time;
    });
    setPlayheadTime(time);
  }, []);

  return (
    <AudioContext.Provider
      value={{
        audioRefs,
        isPlaying,
        playheadTime,
        duration,
        playAll,
        pauseAll,
        stopAll,
        seekAll,
        setPlayheadTime, // exposed manually if needed
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioEngine() {
  return useContext(AudioContext);
}
