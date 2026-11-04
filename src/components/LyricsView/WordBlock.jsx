// src/components/LyricsView/WordBlock.jsx
import React from "react";
import { useWordVisual, useWordSelectionActions } from "../../contexts/lyricsContexts/WordSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import "./LyricsView.css";

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const m = hex.replace("#", "");
  const [r, g, b] = [m.slice(0, 2), m.slice(2, 4), m.slice(4, 6)].map((h) =>
    parseInt(h || "00", 16)
  );
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const WordBlock = React.memo(function WordBlock({
  word,
  lineIdx,
  wordIdx,
  isCurrent,
  onWordHover,
  onHoverEnd,
}) {
  const wordId = `${lineIdx}-${wordIdx}`;

  // Per-word subscriptions (utils/selectorStore): this block re-renders only
  // when ITS visual/anchor/syllable state changes, not on every selection.
  const { anchorOrAdopt, removeSelection, markWordInteraction } = useWordSelectionActions();
  const { vis, anchorForThisWord } = useWordVisual(wordId);
  const { wordActiveColor, wordOpacity, alliterationTier, showRhymes } = useParams();

  const isAnchor    = vis?.roles?.isAnchor       ?? false;
  const isRhyme     = vis?.roles?.isRhyme        ?? false;
  const isAllit     = vis?.roles?.isAlliteration ?? false;
  const isAssonance = vis?.roles?.isAssonance    ?? false;

  const baseOpacity = wordOpacity ?? 0.6;
  const score = vis?.score ?? 1;

  // Per-role colors from the selection that produced each match
  const rhymeColor = vis?.rhymeInfo?.color ?? vis?.color ?? wordActiveColor;
  const allitColor = vis?.alliterationInfo?.color ?? vis?.color ?? wordActiveColor;
  const asonColor  = vis?.assonanceInfo?.color ?? vis?.color ?? wordActiveColor;
  const rhymeScore = vis?.rhymeInfo?.score ?? score;
  const allitScore = vis?.alliterationInfo?.score ?? score;
  const asonScore  = vis?.assonanceInfo?.score ?? score;

  // Dynamic styling only when this word is an anchor/match; at rest the span
  // carries no inline style (see LyricsView.css for the static rules).
  let wordStyle;
  if (isAnchor || (isRhyme && showRhymes) || (isAllit && alliterationTier !== "off") || isAssonance) {
    wordStyle = {};
    // background tint — opacity scales with match score (same as tapestry)
    if (isAnchor) {
      wordStyle.backgroundColor = hexToRgba(vis?.color || wordActiveColor, baseOpacity);
    } else if (isRhyme && showRhymes) {
      wordStyle.backgroundColor = hexToRgba(rhymeColor, baseOpacity * rhymeScore);
    }
    // outline — anchor full, alliteration score-scaled
    if (isAnchor) {
      wordStyle.outline = `3px solid ${hexToRgba(vis?.color || wordActiveColor, 1)}`;
    } else if (alliterationTier !== "off" && isAllit) {
      wordStyle.outline = `2px solid ${hexToRgba(allitColor, allitScore)}`;
    }
    // underline: assonance = dotted, score-scaled opacity
    if (isAssonance) {
      wordStyle.textDecorationLine = "underline";
      wordStyle.textDecorationColor = hexToRgba(asonColor, baseOpacity * asonScore);
    }
  }

  function onToggleAnchor() {
    markWordInteraction();
    if (anchorForThisWord) {
      removeSelection(anchorForThisWord.id);
    } else {
      anchorOrAdopt(wordId);
    }
  }

  return (
    <div className="word-wrapper">
      {/* Word text toggles anchor adopt/remove */}
      <span
        className={`word ${isCurrent ? "current" : ""}`}
        onClick={onToggleAnchor}
        onMouseEnter={() => onWordHover?.(word)}
        onMouseLeave={onHoverEnd}
        style={wordStyle}
        title={
          anchorForThisWord
            ? "Click to remove word anchor"
            : "Click to add/adopt word anchor"
        }
      >
        {word.text}
      </span>
    </div>
  );
});
