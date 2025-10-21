// src/components/TapestryView/vocals/WordGlyphs.jsx
import React, { useState } from "react";
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
  const {
    matchedWordIds, // rhyme/exact matches (existing)
    selectedWordIds,
    alliterationMatchedWordIds, // words sharing first phone
  } = useWordSelection();

  const {
    showWords,
    wordActiveColor,
    wordInactiveColor,
    wordOpacity,
    showRhymes,
    showAlliteration,
  } = useParams();

  const { seekAll } = useAudioEngine();

  // 🔹 Track hovered word id (e.g., "li-wi")
  const [hoveredWordId, setHoveredWordId] = useState(null);

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
      const isAllit = alliterationMatchedWordIds.has(id);
      const isHovered = hoveredWordId === id;

      // Base fill: active color when selected OR (matched and showRhymes), else inactive
      const fill =
        isSelected || (isMatch && showRhymes)
          ? wordActiveColor
          : wordInactiveColor;

      // Base filled bar (click/hover handlers live here)
      glyphs.push(
        <rect
          key={`${id}-base`}
          x={startX}
          y={rectY}
          width={widthPx}
          height={barHeight}
          fill={fill}
          opacity={wordOpacity}
          stroke="none"
          style={{ cursor: "pointer" }}
          onClick={() => seekAll(word.start)}
          onMouseEnter={(e) => {
            setHoveredWordId(id);
            onGlyphHoverEnter?.(e, {
              type: "word",
              wordText: word.text,
              phones: Array.isArray(word.phones)
                ? word.phones.join(" ")
                : String(word.phones || ""),
            });
          }}
          onMouseLeave={(e) => {
            setHoveredWordId(null);
            onGlyphHoverLeave?.(e);
          }}
        />
      );

      // Alliteration outline (5px, wordActiveColor) — optional layer
      if (showAlliteration && isAllit && !isSelected) {
        glyphs.push(
          <rect
            key={`${id}-allit`}
            x={startX}
            y={rectY}
            width={widthPx}
            height={barHeight}
            fill="none"
            stroke={wordActiveColor}
            strokeWidth={5}
            opacity={1}
            pointerEvents="none" // outline shouldn't swallow pointer events
          />
        );
      }

      // 🔹 Hover outline (active color). Renders above base (and alliteration),
      // but below the selected outline so selection stays visually dominant.
      if (isHovered && !isSelected) {
        glyphs.push(
          <rect
            key={`${id}-hover`}
            x={startX}
            y={rectY}
            width={widthPx}
            height={barHeight}
            fill="none"
            stroke={wordActiveColor}
            strokeWidth={3}
            opacity={1}
            pointerEvents="none"
          />
        );
      }

      // Selected outline (7px, red) — always on top
      if (isSelected) {
        glyphs.push(
          <rect
            key={`${id}-selected`}
            x={startX}
            y={rectY}
            width={widthPx}
            height={barHeight}
            fill="none"
            stroke="#aa0000"
            strokeWidth={7}
            opacity={1}
            pointerEvents="none"
          />
        );
      }
    });
  });

  return <>{glyphs}</>;
}
