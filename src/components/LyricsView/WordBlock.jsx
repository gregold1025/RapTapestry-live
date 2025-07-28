// src/components/LyricsView/WordBlock.jsx
import React from "react";
import { extractVowels } from "../../utils/extractVowels";
import { useWordSelection } from "../../contexts/WordSelectionContext";
import { useSyllableSelection } from "../../contexts/SyllableSelectionContext";

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
  const isHovered = hoverData?.type === "word" && hoverData.text === word.text;

  const {
    selectedWordId,
    matchedWordIds,
    toggleWord,
    wordActiveColor,
    wordInactiveColor,
    wordOpacity,
  } = useWordSelection();

  const { selectedIds, matchedIds, handleSyllableClick, vowelColors } =
    useSyllableSelection();

  const isWordSelected = selectedWordId === wordId;
  const isWordMatched = matchedWordIds.has(wordId);

  // small helper to turn "#rrggbb" into "rgba(r,g,b,alpha)"
  const hexToRgba = (hex, alpha = 1) => {
    const [r, g, b] = hex
      .replace(/^#/, "")
      .match(/.{2}/g)
      .map((h) => parseInt(h, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // choose base fill hex, then apply alpha
  const baseHex =
    isWordSelected || isWordMatched ? wordActiveColor : wordInactiveColor;

  const bgRgba = hexToRgba(baseHex, wordOpacity);

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
                width: 20,
                height: 20,
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

      <span
        className="word"
        onClick={() => toggleWord(wordId)}
        onMouseEnter={() => onWordHover?.(word)}
        onMouseLeave={onHoverEnd}
        style={{
          fontSize: 30,
          fontWeight: isCurrent ? "bold" : "normal",
          backgroundColor: bgRgba,
          cursor: "pointer",
          padding: "0 4px",
        }}
      >
        {word.text}
      </span>
    </div>
  );
}
