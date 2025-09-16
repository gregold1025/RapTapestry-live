import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { WordLine } from "./WordLine";
import { HoverDisplay } from "./HoverDisplay";
import { useHoverInfo } from "./hooks/useHoverInfo";
import { useAudioEngine } from "../../contexts/AudioContext";
import { useFitTextToLines } from "./hooks/useFitTextToLines";
import "./LyricsView.css";

export default function LyricsView({ transcriptionData, height = "100%" }) {
  const containerRef = useRef(null); // outer container (for sizing)
  const scrollRef = useRef(null); // scrollable div (the list of all lines)
  const suppressUntilRef = useRef(0); // timestamp (ms) to ignore scroll events until
  const { playheadTime } = useAudioEngine();
  const { hoverData, setWordHover, setSyllableHover, clearHover } =
    useHoverInfo();

  const lines = transcriptionData?.lines ?? [];

  // ------- TUNING: sizing knobs -------
  const nVisibleLines = 12; // how many lines should be visible at once
  const scale = 1.0; // small manual nudge (0.95–1.1)
  const lineHeight = 1.2;
  const verticalPaddingPx = 24; // .lyrics-lines has 12px padding top/btm

  useFitTextToLines(containerRef, {
    nLines: nVisibleLines,
    lineHeight,
    verticalPaddingPx,
    scale,
    minPx: 12,
    maxPx: 64,
  });

  // Current line from playhead
  const currentLineIndex = useMemo(() => {
    for (let i = 0; i < lines.length; i++) {
      const start = lines[i]?.words?.[0]?.start ?? Infinity;
      const nextStart = lines[i + 1]?.words?.[0]?.start ?? Infinity;
      if (playheadTime >= start && playheadTime < nextStart) return i;
    }
    return -1;
  }, [lines, playheadTime]);

  // Follow state: starts ON; user scroll turns it OFF; Recenter turns it ON
  const [isFollowing, setIsFollowing] = useState(true);

  // Helper: programmatically scroll current line to top of scroller
  const scrollToCurrentLine = useCallback(
    (behavior = "smooth") => {
      if (currentLineIndex < 0) return;
      const scroller = scrollRef.current;
      if (!scroller) return;

      // Ensure DOM has rendered line nodes
      requestAnimationFrame(() => {
        const el = scroller.querySelector(
          `[data-line-idx="${currentLineIndex}"]`
        );
        if (!el) return;

        // Suppress scroll events for the duration of the smooth animation.
        // Use a generous window to cover long distances & OS settings.
        const now = performance.now();
        const SUPPRESS_MS = behavior === "smooth" ? 1200 : 0;
        suppressUntilRef.current = now + SUPPRESS_MS;

        el.scrollIntoView({ block: "start", inline: "nearest", behavior });
      });
    },
    [currentLineIndex]
  );

  // Initial anchor + follow on each line change (if following)
  const prevLineRef = useRef(-1);
  useEffect(() => {
    if (currentLineIndex < 0) return;

    if (isFollowing && currentLineIndex !== prevLineRef.current) {
      const behavior = prevLineRef.current === -1 ? "auto" : "smooth";
      scrollToCurrentLine(behavior);
      prevLineRef.current = currentLineIndex;
    } else if (prevLineRef.current === -1) {
      // Track first known line even if not following
      prevLineRef.current = currentLineIndex;
    }
  }, [currentLineIndex, isFollowing, scrollToCurrentLine]);

  // Any real user scroll disables following; ignore our own programmatic scrolls
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const onScroll = () => {
      if (performance.now() < suppressUntilRef.current) return; // ignore programmatic scroll
      setIsFollowing(false);
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} className="lyrics-container" style={{ height }}>
      {/* SCROLLER */}
      <div ref={scrollRef} className="lyrics-lines">
        {lines.map((line, idx) => (
          <WordLine
            key={idx}
            line={line}
            lineIdx={idx}
            playheadTime={playheadTime}
            isCurrent={idx === currentLineIndex}
            hoverData={hoverData}
            onWordHover={setWordHover}
            onSyllableHover={setSyllableHover}
            onHoverEnd={clearHover}
            dataLineIdx={idx} // rendered as data-line-idx in WordLine
          />
        ))}
      </div>

      {/* Footer: recenter + hover info */}
      <div className="lyrics-footer">
        <button
          className="recenter-btn"
          onClick={() => {
            setIsFollowing(true); // re-enable following first
            scrollToCurrentLine("smooth");
          }}
          disabled={currentLineIndex < 0}
          title={isFollowing ? "Following playhead" : "Re-enable following"}
        >
          {isFollowing ? "Following…" : "Recenter"}
        </button>
        <div className="footer-spacer" />
        <div className="footer-hover">
          <HoverDisplay hoverData={hoverData} />
        </div>
      </div>
    </div>
  );
}
