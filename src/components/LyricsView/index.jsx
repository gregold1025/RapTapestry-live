import React, { useRef } from "react";
import { WordLine } from "./WordLine";
import { HoverDisplay } from "./HoverDisplay";
import { useHoverInfo } from "./hooks/useHoverInfo";
import { useAudioEngine } from "../../contexts/AudioContext";
import { useFitTextToLines } from "./hooks/useFitTextToLines";
import "./LyricsView.css";

export default function LyricsView({ transcriptionData, height = "100%" }) {
  const containerRef = useRef(null);
  const { playheadTime } = useAudioEngine();
  const { hoverData, setWordHover, setSyllableHover, clearHover } =
    useHoverInfo();

  const lines = transcriptionData?.lines ?? [];

  // ——— TUNING KNOBS ———
  const nLines = 1000; // how many lines should be visible
  const scale = 8.0; // manual multiplier (try 0.95 ~ 1.10 to taste)
  const lineHeight = 1.2;
  const verticalPaddingPx = 24; // matches padding: 12px top + 12px bottom

  useFitTextToLines(containerRef, {
    nLines,
    lineHeight,
    verticalPaddingPx,
    scale,
    minPx: 12,
    maxPx: 64,
  });

  // locate current line by playhead
  let lastValidLineIndex = 0;
  const currentLineIndex = lines.findIndex((line, idx) => {
    const start = line.words?.[0]?.start ?? Infinity;
    const nextStart = lines[idx + 1]?.words?.[0]?.start ?? Infinity;
    return playheadTime >= start && playheadTime < nextStart;
  });
  if (currentLineIndex !== -1) lastValidLineIndex = currentLineIndex;

  // choose the slice we show
  const visibleLines = lines.slice(
    lastValidLineIndex,
    lastValidLineIndex + nLines
  );

  return (
    <div ref={containerRef} className="lyrics-container" style={{ height }}>
      <div className="lyrics-lines">
        {visibleLines.map((line, idx) => (
          <WordLine
            key={idx}
            line={line}
            lineIdx={lastValidLineIndex + idx}
            playheadTime={playheadTime}
            isCurrent={idx === 0}
            hoverData={hoverData}
            onWordHover={setWordHover}
            onSyllableHover={setSyllableHover}
            onHoverEnd={clearHover}
          />
        ))}
      </div>

      <HoverDisplay hoverData={hoverData} />
    </div>
  );
}
