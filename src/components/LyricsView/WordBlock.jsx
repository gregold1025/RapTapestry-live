// src/components/LyricsView/WordBlock.jsx
import React from "react";
import { extractVowels } from "../../utils/extractVowels";
import { useWordSelection } from "../../contexts/lyricsContexts/WordSelectionContext";
import { useSyllableSelection } from "../../contexts/lyricsContexts/SyllableSelectionContext";
import { useParams } from "../../contexts/ParamsContext";

import "./LyricsView.css";

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

  const { selectedWordId, matchedWordIds, toggleWord } = useWordSelection();
  const { wordActiveColor, wordInactiveColor, wordOpacity } = useParams();

  // console.log(
  //   `%c[WordBlock:${lineIdx}-${wordIdx}]`,
  //   "color:orange",
  //   "selectedWordId=",
  //   selectedWordId,
  //   "matchedWordIds=",
  //   [...matchedWordIds]
  // );

  const { selectedIds, matchedIds, handleSyllableClick, vowelColors } =
    useSyllableSelection();

  const isWordSelected = selectedWordId === wordId;
  const isWordMatched = selectedWordId !== null && matchedWordIds.has(wordId);

  // small helper to turn "#rrggbb" into "rgba(r,g,b,alpha)"
  const hexToRgba = (hex, alpha = 1) => {
    const [r, g, b] = hex
      .replace(/^#/, "")
      .match(/.{2}/g)
      .map((h) => parseInt(h, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const bgRgba =
    isWordSelected || isWordMatched
      ? hexToRgba(wordActiveColor, wordOpacity)
      : "transparent";

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
        className={`word ${isCurrent ? "current" : ""}`}
        onClick={() => toggleWord(wordId)}
        onMouseEnter={() => onWordHover?.(word)}
        onMouseLeave={onHoverEnd}
      >
        {word.text}
      </span>
    </div>
  );
}
