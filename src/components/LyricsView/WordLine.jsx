// src/components/LyricsView/WordLine.jsx
import { useMemo } from "react";
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
  isCurrent,
  currentWordId,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
  dataLineIdx,
}) {
  const { getVisualForLine, selections, anchorOrAdopt, removeSelection } =
    useLineSelection();
  const { showEndRhymes, lineOpacity } = useParams();
  const { seekAll } = useAudioEngine();

  const vis = getVisualForLine(lineIdx); // null | { role: "anchor"|"match", color, selectionId }

  const anchorForThisLine = useMemo(() => {
    const candidates = selections.filter((s) => s.lineIdx === lineIdx);
    if (!candidates.length) return null;
    return candidates.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  }, [selections, lineIdx]);

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

  // Only the tint/outline are dynamic; everything else lives in LyricsView.css
  // so the ~150 line nodes carry no inline style at rest (cheaper style
  // resolution + DOM commit on load).
  const lineStyle =
    showColor || vis?.role === "anchor"
      ? { backgroundColor: bgColor, outline: outlineStyle }
      : undefined;

  return (
    <div
      className={["line", isCurrent ? "current" : ""].join(" ").trim()}
      data-line-idx={dataLineIdx}
      style={lineStyle}
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
      >
        {anchorForThisLine ? "■" : "□"}
      </div>

      {/* Words — content opacity stays at 1 for legibility */}
      <div className="words-container">
        {line.words?.map((word, wordIdx) => (
          <WordBlock
            key={wordIdx}
            word={word}
            lineIdx={lineIdx}
            wordIdx={wordIdx}
            isCurrent={`${lineIdx}-${wordIdx}` === currentWordId}
            onWordHover={onWordHover}
            onSyllableHover={onSyllableHover}
            onHoverEnd={onHoverEnd}
          />
        ))}
      </div>

      {/* Hover-only jump button (right-aligned); shown via .line:hover in CSS */}
      <button
        type="button"
        className="line-jump"
        aria-label="Jump to this line"
        title="Jump to this line"
        onClick={() => seekAll(line.start)}
      >
        ⏱
      </button>
    </div>
  );
}
