// src/components/TapestryView/WordGlyphs.jsx
import React from "react";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import { useWordSelection } from "../../contexts/WordSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import { useAudioEngine } from "../../contexts/AudioContext";

export default function WordGlyphs({
  transcriptionData,
  timeToX,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { matchedWordIds, selectedWordIds, toggleWord } = useWordSelection();
  const { wordColors } = useParams(); // e.g. { default: "#88ccee", match: "#cccccc", selected: "#ff8888" }
  const { seekAll } = useAudioEngine();
  if (!layout || !timeToX) return null;

  const { secondsPerRow, rowHeight, width } = layout;
  const barHeight = rowHeight * 0.4; // 60% of row
  const vPad = rowHeight - barHeight; // vertical centering

  const glyphs = [];

  transcriptionData.lines.forEach((line, lineIdx) => {
    if (!line.words) return;
    line.words.forEach((word, wordIdx) => {
      if (typeof word.start !== "number" || typeof word.end !== "number")
        return;

      const id = `${lineIdx}-${wordIdx}`;
      const startX = timeToX(word.start);
      // width of word-bar may wrap row boundaries, so mod by secondsPerRow
      const dur = word.end - word.start;
      const widthPx = (dur / secondsPerRow) * width;
      const row = Math.floor(word.start / secondsPerRow);
      const y = row * rowHeight + vPad;

      const isSelected = selectedWordIds.includes(id);
      const isMatch = matchedWordIds.has(id);

      // pick colors from params or defaults
      const fill = isSelected
        ? wordColors?.selected ?? "#ff8888"
        : isMatch
        ? wordColors?.match ?? "#ff8888"
        : wordColors?.default ?? "#88ccee";
      const stroke = isSelected ? "#aa0000" : isMatch ? "#444444" : "none";
      const strokeWidth = isSelected || isMatch ? 2 : 0;

      glyphs.push(
        <rect
          key={id}
          x={startX}
          y={y}
          width={widthPx}
          height={barHeight}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
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
