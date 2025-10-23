// src/components/LyricsView/WordLine.jsx
import { useState, useMemo } from "react";
import { WordBlock } from "./WordBlock";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import { useAudioEngine } from "../../contexts/AudioContext";

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const m = hex.replace("#", "");
  const [r, g, b] = [m.slice(0, 2), m.slice(2, 4), m.slice(4, 6)].map((h) =>
    parseInt(h || "00", 16)
  );
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  const { getVisualForLine, selections, anchorOrAdopt, removeSelection } =
    useLineSelection();
  const { showEndRhymes, lineOpacity } = useParams();
  const { seekAll } = useAudioEngine();
  const [hovered, setHovered] = useState(false);

  const vis = getVisualForLine(lineIdx); // null | { role: "anchor"|"match", color, selectionId }

  const anchorForThisLine = useMemo(() => {
    const candidates = selections.filter((s) => s.lineIdx === lineIdx);
    if (!candidates.length) return null;
    return candidates.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  }, [selections, lineIdx]);

  const isCurrent = playheadTime >= line.start && playheadTime < line.end;

  // Anchors always show; matches show only if toggle is on.
  const showColor =
    !!vis && (vis.role === "anchor" || (vis.role === "match" && showEndRhymes));
  const bgColor = showColor
    ? hexToRgba(vis.color, typeof lineOpacity === "number" ? lineOpacity : 0.6)
    : "transparent";
  const outlineStyle =
    vis?.role === "anchor" ? `2px solid ${vis.color}` : "none";

  function onToggleAnchor() {
    if (anchorForThisLine) {
      removeSelection(anchorForThisLine.id);
    } else {
      // adopt existing selection if this line belongs to a match group; otherwise create
      anchorOrAdopt(lineIdx);
    }
  }

  return (
    <div
      className={["line", isCurrent ? "current" : ""].join(" ").trim()}
      data-line-idx={dataLineIdx}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        paddingBottom: 6,
        borderBottom: "1px dashed #ccc",
        backgroundColor: bgColor, // ← tint only
        display: "flex",
        alignItems: "center",
        gap: "12px",
        outline: outlineStyle,
        outlineOffset: "-2px",
        paddingRight: "42px",
        // DO NOT set container opacity; keep text 100% legible
      }}
      title={
        "Click □ to toggle an anchor • Matches colorize when 'End Rhymes' is on"
      }
    >
      {/* Anchor toggle (square) */}
      <div
        className="line-select"
        onClick={onToggleAnchor}
        title={anchorForThisLine ? "Remove anchor" : "Add / Adopt anchor"}
        aria-pressed={!!anchorForThisLine}
        role="button"
        style={{ cursor: "pointer" }}
      >
        {anchorForThisLine ? "■" : "□"}
      </div>

      {/* Words — content opacity stays at 1 for legibility */}
      <div
        className="words-container"
        style={{ display: "flex", flexWrap: "wrap", gap: "6px", opacity: 1 }}
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
