import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useWordSelection } from "../../../contexts/lyricsContexts/WordSelectionContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useAudioEngine } from "../../../contexts/AudioContext";

export default function WordGlyphs({
  transcriptionData,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { matchedWordIds, selectedWordIds } = useWordSelection();
  const { showWords, wordActiveColor, wordInactiveColor, wordOpacity } =
    useParams();
  const { seekAll } = useAudioEngine();

  if (!layout || !showWords) return null;

  const { rowHeight, timeToPixels } = layout;
  const barHeight = rowHeight * 0.3;
  const vPad = (rowHeight - barHeight) / 2 - 4;

  const glyphs = [];

  transcriptionData.lines.forEach((line, lineIdx) => {
    if (!line.words) return;
    line.words.forEach((word, wordIdx) => {
      if (typeof word.start !== "number" || typeof word.end !== "number")
        return;

      const id = `${lineIdx}-${wordIdx}`;
      const { x: startX, y, row } = timeToPixels(word.start);
      const { x: endX } = timeToPixels(word.end);
      const widthPx = Math.max(1, endX - startX);
      const rectY = row * rowHeight + vPad;

      const isSelected = selectedWordIds.includes(id);
      const isMatch = matchedWordIds.has(id);

      const fill = isSelected || isMatch ? wordActiveColor : wordInactiveColor;
      const stroke = isSelected ? "#aa0000" : "none";

      glyphs.push(
        <rect
          key={id}
          x={startX}
          y={rectY}
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
