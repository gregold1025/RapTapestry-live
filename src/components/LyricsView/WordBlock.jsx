// src/components/LyricsView/WordBlock.jsx
import React, { useMemo } from "react";
import { extractVowels } from "../../utils/extractVowels";
import { useWordSelection } from "../../contexts/lyricsContexts/WordSelectionContext";
import { useSyllableSelection } from "../../contexts/lyricsContexts/SyllableSelectionContext";
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

export function WordBlock({
  word,
  lineIdx,
  wordIdx,
  isCurrent,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
}) {
  const vowels = extractVowels(word.phones?.[0]);
  const nSyllables = word.nSyllables ?? 1;

  const wordId = `${lineIdx}-${wordIdx}`;

  const { getVisualForWord, selections, anchorOrAdopt, removeSelection, markWordInteraction } =
    useWordSelection();

  const { wordActiveColor, wordOpacity, alliterationTier, showRhymes } =
    useParams();

  const { selectedIds, matchedIds, handleSyllableClick, vowelColors } =
    useSyllableSelection();

  // latest anchor (if multiple anchors ever pointed to this word)
  const anchorForThisWord = useMemo(() => {
    const candidates = (selections || []).filter((s) => s.wordId === wordId);
    if (!candidates.length) return null;
    return candidates.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  }, [selections, wordId]);

  const vis = getVisualForWord(wordId); // null | { color, score, roles }
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
      <div className="syllable-row">
        {Array.from({ length: nSyllables }).map((_, i) => {
          const id = `${lineIdx}-${wordIdx}-${i}`;
          const vowel = vowels[i] ?? "AH";
          const color = vowelColors[vowel] ?? "#cccccc";

          const isSel = selectedIds.includes(id);
          const isMtch = matchedIds.has(id);

          return (
            <div
              key={i}
              className={
                "lyrics-syllable-circle" + (isSel ? " selected" : "")
              }
              style={isSel || isMtch ? { backgroundColor: color } : undefined}
              onClick={() => handleSyllableClick(id, vowel)}
              onMouseEnter={() =>
                onSyllableHover?.({
                  vowel,
                  syllableIndex: i,
                  totalSyllables: nSyllables,
                  phones: word.phones?.join(" ") || "",
                })
              }
              onMouseLeave={onHoverEnd}
            />
          );
        })}
      </div>

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
}
