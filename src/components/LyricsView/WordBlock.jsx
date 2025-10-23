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
  playheadTime,
  hoverData,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
}) {
  const vowels = extractVowels(word.phones?.[0]);
  const nSyllables = word.nSyllables ?? 1;

  const wordId = `${lineIdx}-${wordIdx}`;
  const isCurrent = playheadTime >= word.start && playheadTime < word.end;

  const { getVisualForWord, selections, anchorOrAdopt, removeSelection } =
    useWordSelection();

  const { wordActiveColor, wordOpacity, showAlliteration, showRhymes } =
    useParams();

  const { selectedIds, matchedIds, handleSyllableClick, vowelColors } =
    useSyllableSelection();

  // latest anchor (if multiple anchors ever pointed to this word)
  const anchorForThisWord = useMemo(() => {
    const candidates = (selections || []).filter((s) => s.wordId === wordId);
    if (!candidates.length) return null;
    return candidates.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  }, [selections, wordId]);

  const vis = getVisualForWord(wordId); // null | {role,color}
  const isAnchor = vis?.role === "anchor";
  const isMatch = vis?.role === "match";
  const isAllit = vis?.role === "alliteration";

  // background tint for selected/rhyme matches
  const bgRgba =
    isAnchor || (isMatch && showRhymes)
      ? hexToRgba(vis?.color || wordActiveColor, wordOpacity ?? 0.6)
      : "transparent";

  // outline for anchor (strong) or alliteration (if toggle on)
  const outlineStyle = isAnchor
    ? `3px solid ${vis?.color || wordActiveColor}`
    : showAlliteration && isAllit
    ? `3px solid ${vis?.color || wordActiveColor}`
    : "none";

  function onToggleAnchor() {
    if (anchorForThisWord) {
      removeSelection(anchorForThisWord.id);
    } else {
      anchorOrAdopt(wordId);
    }
  }

  return (
    <div
      className="word-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "4px",
      }}
    >
      <div
        className="syllable-row"
        style={{ display: "flex", gap: "4px", marginBottom: "4px" }}
      >
        {Array.from({ length: nSyllables }).map((_, i) => {
          const id = `${lineIdx}-${wordIdx}-${i}`;
          const vowel = vowels[i] ?? "AH";
          const color = vowelColors[vowel] ?? "#cccccc";

          const isSel = selectedIds.includes(id);
          const isMtch = matchedIds.has(id);

          return (
            <div
              key={i}
              className="lyrics-syllable-circle"
              style={{
                borderRadius: "50%",
                backgroundColor: isSel || isMtch ? color : "#cccccc",
                border: isSel ? "2px solid red" : "1px solid #999",
                cursor: "pointer",
              }}
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
        style={{
          backgroundColor: bgRgba,
          outline: outlineStyle,
          outlineOffset: "0px",
          cursor: "pointer",
        }}
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
