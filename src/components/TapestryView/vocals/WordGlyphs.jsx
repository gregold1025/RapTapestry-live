// src/components/Tapestry/Vocals/WordGlyphs.jsx
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
  const { getVisualForWord, anchorOrAdopt, selections, removeSelection } =
    useWordSelection();

  const {
    showWords,
    wordActiveColor,
    wordInactiveColor,
    wordOpacity,
    showRhymes,
    showAlliteration,
  } = useParams();

  const { seekAll } = useAudioEngine();
  const [hoveredWordId, setHoveredWordId] = useState(null);

  if (!layout || !showWords) return null;

  const { rowHeight, timeToPixels } = layout;
  const barHeight = rowHeight * 0.3;
  const vPad = (rowHeight - barHeight) / 2 - 4;

  function removeMostRecentAnchorFor(wordId) {
    const candidates = selections.filter((s) => s.wordId === wordId);
    if (!candidates.length) return;
    const mostRecent = candidates.reduce((a, b) =>
      a.createdAt > b.createdAt ? a : b
    );
    removeSelection(mostRecent.id);
  }

  const glyphs = [];

  transcriptionData.lines.forEach((line, lineIdx) => {
    if (!line.words) return;

    line.words.forEach((word, wordIdx) => {
      if (typeof word.start !== "number" || typeof word.end !== "number")
        return;

      const id = `${lineIdx}-${wordIdx}`;
      const vis = getVisualForWord(id); // null | {role,color,selectionId}

      const { x: startX, row } = timeToPixels(word.start);
      const { x: endX } = timeToPixels(word.end);
      const widthPx = Math.max(1, endX - startX);
      const rectY = row * rowHeight + vPad;

      // Base fill:
      // - anchors always colorize;
      // - rhyme/exact matches colorize only if showRhymes;
      // - alliteration does NOT fill (it outlines), unless you want it to—here we keep outline only.
      const isAnchor = vis?.role === "anchor";
      const isMatch = vis?.role === "match";
      const fill =
        isAnchor || (isMatch && showRhymes) ? vis.color : wordInactiveColor;

      const isHovered = hoveredWordId === id;

      glyphs.push(
        <rect
          key={`${id}-base`}
          x={startX}
          y={rectY}
          width={widthPx}
          height={barHeight}
          fill={fill}
          opacity={wordOpacity}
          stroke={isAnchor ? vis.color : "none"}
          strokeWidth={isAnchor ? 5 : 0}
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            // Cmd/Ctrl + click => adopt-or-create anchor
            if (e.metaKey || e.ctrlKey) {
              e.stopPropagation();
              anchorOrAdopt(id);
              return;
            }
            // Alt + click => remove most recent anchor for this word
            if (e.altKey) {
              e.stopPropagation();
              removeMostRecentAnchorFor(id);
              return;
            }
            // default: seek
            seekAll(word.start);
          }}
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
          title={
            "Click: seek • Cmd/Ctrl+Click: adopt/create anchor • Alt+Click: remove anchor"
          }
        />
      );

      // Optional alliteration outline (only if toggle on & this word is alliteration vis)
      if (showAlliteration && vis?.role === "alliteration") {
        glyphs.push(
          <rect
            key={`${id}-allit`}
            x={startX}
            y={rectY}
            width={widthPx}
            height={barHeight}
            fill="none"
            stroke={vis.color}
            strokeWidth={4}
            opacity={1}
            pointerEvents="none"
          />
        );
      }

      // Hover outline
      if (isHovered && !isAnchor) {
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
    });
  });

  return <>{glyphs}</>;
}
