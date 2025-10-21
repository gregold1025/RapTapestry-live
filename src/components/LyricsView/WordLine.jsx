// src/components/LyricsView/WordLine.jsx
import { useState } from "react";
import { WordBlock } from "./WordBlock";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import { useAudioEngine } from "../../contexts/AudioContext";

export function WordLine({
  line,
  lineIdx,
  playheadTime,
  hoverData,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
  dataLineIdx,
}) {
  const { selectedLineIdx, toggleLine, matchedLineIdxs } = useLineSelection();
  const { lineActiveColor, lineOpacity, showEndRhymes } = useParams();
  const { seekAll } = useAudioEngine();

  const [hovered, setHovered] = useState(false);

  const isSelected = selectedLineIdx === lineIdx;
  const isMatched = matchedLineIdxs?.has?.(lineIdx);
  const isCurrent = playheadTime >= line.start && playheadTime < line.end;

  const hexToRgba = (hex, alpha = 1) => {
    const [r, g, b] = hex
      .replace(/^#/, "")
      .match(/.{2}/g)
      .map((h) => parseInt(h, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const bgRgba =
    isSelected || (isMatched && showEndRhymes)
      ? hexToRgba(lineActiveColor, lineOpacity)
      : "transparent";

  const outlineStyle = isSelected ? "2px solid red" : "none";

  return (
    <div
      className={[
        "line",
        isCurrent ? "current" : "",
        isSelected ? "selected" : "",
        isMatched ? "matched" : "",
      ]
        .join(" ")
        .trim()}
      data-line-idx={dataLineIdx}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", // allow right-aligned absolute button
        paddingBottom: 6,
        borderBottom: "1px dashed #ccc",
        backgroundColor: bgRgba,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        outline: outlineStyle,
        outlineOffset: "-2px",
        paddingRight: "42px", // make room for the hover button
      }}
    >
      <div
        className="line-select"
        onClick={() => toggleLine(lineIdx)}
        title={isSelected ? "Unselect line" : "Select line"}
        aria-pressed={isSelected}
        role="button"
      >
        {isSelected ? "■" : "□"}
      </div>

      <div
        className="words-container"
        style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
      >
        {line.words?.map((word, wordIdx) => (
          <WordBlock
            key={wordIdx}
            word={word}
            lineIdx={lineIdx}
            wordIdx={wordIdx}
            playheadTime={playheadTime}
            hoverData={hoverData}
            onWordHover={onWordHover}
            onSyllableHover={onSyllableHover}
            onHoverEnd={onHoverEnd}
          />
        ))}
      </div>

      {/* Hover-only jump button (right-aligned) */}
      <button
        type="button"
        aria-label="Jump to this line"
        title="Jump to this line"
        onClick={() => seekAll(line.start)}
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          display: hovered ? "inline-flex" : "none",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 6,
          border: "1px solid #d0d0d0",
          background: "#fff",
          color: "#000",
          cursor: "pointer",
          lineHeight: 1,
          fontSize: "1rem",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      >
        ⏱
      </button>
    </div>
  );
}
