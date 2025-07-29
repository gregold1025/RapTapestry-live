// src/components/TapestryView/WordGlyphs.jsx
import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useWordSelection } from "../../../contexts/lyricsContexts/WordSelectionContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useAudioEngine } from "../../../contexts/AudioContext";

export default function WordGlyphs({
  transcriptionData,
  timeToX,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { matchedWordIds, selectedWordIds } = useWordSelection();
  const { showWords, wordActiveColor, wordInactiveColor, wordOpacity } =
    useParams();
  const { seekAll } = useAudioEngine();

  if (!layout || !timeToX || !showWords) return null;

  const { secondsPerRow, rowHeight, width } = layout;
  const barHeight = rowHeight * 0.3;
  const vPad = (rowHeight - barHeight) / 2 - 4;

  const glyphs = [];

  transcriptionData.lines.forEach((line, lineIdx) => {
    if (!line.words) return;
    line.words.forEach((word, wordIdx) => {
      if (typeof word.start !== "number" || typeof word.end !== "number")
        return;

      const id = `${lineIdx}-${wordIdx}`;
      const startX = timeToX(word.start);
      const dur = word.end - word.start;
      const widthPx = (dur / secondsPerRow) * width;
      const row = Math.floor(word.start / secondsPerRow);
      const y = row * rowHeight + vPad;

      const isSelected = selectedWordIds.includes(id);
      const isMatch = matchedWordIds.has(id);

      // pick fill from params
      const fill = isSelected || isMatch ? wordActiveColor : wordInactiveColor;
      const stroke = isSelected ? "#aa0000" : "none";

      glyphs.push(
        <rect
          key={id}
          x={startX}
          y={y}
          width={widthPx}
          height={barHeight}
          fill={fill}
          opacity={wordOpacity}
          stroke={stroke}
          strokeWidth={isSelected ? 2 : 0}
          style={{ cursor: "pointer" }}
          onClick={() => seekAll(word.start)}
          onMouseEnter={(e) =>
            onGlyphHoverEnter(e, {
              type: "word",
              wordText: word.text,
              phones: Array.isArray(word.phones)
                ? word.phones.join(" ")
                : String(word.phones),
            })
          }
          onMouseLeave={onGlyphHoverLeave}
        />
      );
    });
  });

  return <>{glyphs}</>;
}
