// src/components/LyricsView/WordBlock.jsx
import React from "react";
import { useWordVisual, useQueryActions } from "../../contexts/QueryContext";
import { useParams } from "../../contexts/ParamsContext";
import "./LyricsView.css";

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const m = hex.replace("#", "");
  const [r, g, b] = [m.slice(0, 2), m.slice(2, 4), m.slice(4, 6)].map((h) => parseInt(h || "00", 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const WordBlock = React.memo(function WordBlock({ word, lineIdx, wordIdx, isCurrent, onWordHover, onHoverEnd }) {
  const wordId = `${lineIdx}-${wordIdx}`;
  const vis = useWordVisual(wordId);
  const { click } = useQueryActions();
  const { wordOpacity } = useParams();

  let style;
  if (vis) {
    style = { backgroundColor: hexToRgba(vis.color, vis.isAnchor ? wordOpacity : wordOpacity * (vis.expected ? 0.4 : 0.7)) };
    if (vis.isAnchor) style.outline = `3px solid ${vis.color}`;
    if (vis.form === "mosaic") { style.textDecorationLine = "underline"; style.textDecorationStyle = "dashed"; style.textDecorationColor = vis.color; }
    if (vis.form === "embedded") { style.textDecorationLine = "underline"; style.textDecorationStyle = "dotted"; style.textDecorationColor = vis.color; }
  }

  const label = vis ? (vis.isAnchor ? "query" : `${vis.type}${vis.form !== "word" ? " " + vis.form : ""}${vis.expected ? " (expected)" : ""}`) : null;

  return (
    <div className="word-wrapper">
      <span
        className={`word ${isCurrent ? "current" : ""}`}
        onClick={(e) => click(wordId, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey, alt: e.altKey })}
        onMouseEnter={() => onWordHover?.(word, label)}
        onMouseLeave={onHoverEnd}
        style={style}
        title={label ? `${label} • click: adopt/focus • shift: extend • alt: remove` : "Click: query this word • Shift+Click: extend the focused query • Cmd+Click: new query"}
      >
        {word.text}
      </span>
    </div>
  );
});
