// src/components/LyricsView/WordLine.jsx
import React from "react";
import { WordBlock } from "./WordBlock";
import { useLineVisual, useQueryActions } from "../../contexts/QueryContext";
import { useParams } from "../../contexts/ParamsContext";
import { useAudioControls } from "../../contexts/AudioContext";

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const m = hex.replace("#", "");
  const [r, g, b] = [m.slice(0, 2), m.slice(2, 4), m.slice(4, 6)].map((h) => parseInt(h || "00", 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const WordLine = React.memo(function WordLine({ line, lineIdx, isCurrent, currentWordIdx, onWordHover, onHoverEnd, dataLineIdx }) {
  const vis = useLineVisual(lineIdx);
  const { clickLine } = useQueryActions();
  const { lineOpacity } = useParams();
  const { seekAll } = useAudioControls();

  const lineStyle = vis
    ? { backgroundColor: hexToRgba(vis.color, (typeof lineOpacity === "number" ? lineOpacity : 0.3) * (vis.role === "anchor" ? 1 : 0.6)), outline: vis.role === "anchor" ? `2px solid ${vis.color}` : "none" }
    : undefined;

  return (
    <div className={["line", lineIdx % 2 ? "alt" : "", isCurrent ? "current" : ""].join(" ").replace(/\s+/g, " ").trim()} data-line-idx={dataLineIdx} style={lineStyle}>
      {/* Line query: this line, matched to other lines by the end rhyme of their last words */}
      <div
        className="line-select"
        onClick={(e) => clickLine(lineIdx, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey, alt: e.altKey })}
        title={vis?.role === "anchor" ? "This line is a line query (alt-click: remove)" : vis?.role === "match" ? "This line rhymes with a line query (click: move the query here)" : "Line query: lines whose last word rhymes with this one"}
        aria-pressed={vis?.role === "anchor"}
        role="button"
      >
        {vis?.role === "anchor" ? "■" : "□"}
      </div>

      <div className="words-container">
        {line.words?.map((word, wordIdx) => (
          <WordBlock
            key={wordIdx}
            word={word}
            lineIdx={lineIdx}
            wordIdx={wordIdx}
            isCurrent={wordIdx === currentWordIdx}
            onWordHover={onWordHover}
            onHoverEnd={onHoverEnd}
          />
        ))}
      </div>

      <button type="button" className="line-jump" aria-label="Jump to this line" title="Jump to this line" onClick={() => seekAll(line.start)}>
        ⏱
      </button>
    </div>
  );
});
