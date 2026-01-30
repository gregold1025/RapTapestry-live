import React, { useEffect, useState, useCallback } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useSyllableSelection } from "../../../contexts/lyricsContexts/SyllableSelectionContext";
import { useParams } from "../../../contexts/ParamsContext";
import { extractVowels } from "../../../utils/extractVowels";
import { useAudioEngine } from "../../../contexts/AudioContext";
import "../TapestryView.css";

// ------------------------------------
//  LOAD ALL SVG GLYPH URLS (ONCE)
// ------------------------------------
const glyphUrlModules = import.meta.glob("/src/svg_shapes/*.svg", {
  eager: true,
  import: "default",
});
const GLYPH_URLS = Object.values(glyphUrlModules);

export default function SyllableGlyphs({
  transcriptionData,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { matchedIds, selectedIds } = useSyllableSelection();
  const {
    showSyllables,
    vowelColors,
    inactiveSyllableColor,
    syllableOpacity,
    syllableRadius,
    syllableArcCurve,
    glyphStyle,
  } = useParams();

  const glyphUrl = glyphStyle?.syllableGlyphUrl ?? null;

  const { seekAll } = useAudioEngine();

  // -------------------------------

  if (!layout || !showSyllables) return null;

  const { rowHeight, timeToPixels } = layout;
  const radius = syllableRadius ?? 8;
  const diameter = radius * 2;

  // build a flat-ordered list of all syllable IDs
  const flatOrderedIds = [];
  transcriptionData.lines.forEach((line, li) =>
    line.words?.forEach((word, wi) => {
      const nSyllables = word.nSyllables ?? 1;
      for (let si = 0; si < nSyllables; si++) {
        flatOrderedIds.push(`${li}-${wi}-${si}`);
      }
    })
  );
  const idToFlatIndex = new Map(flatOrderedIds.map((id, idx) => [id, idx]));

  const glyphCoords = new Map();
  const syllables = [];

  transcriptionData.lines.forEach((line, li) => {
    line.words?.forEach((word, wi) => {
      if (typeof word.start !== "number" || typeof word.end !== "number")
        return;

      const nSyllables = word.nSyllables ?? 1;
      const wordDuration = word.end - word.start;
      const syllableDuration = wordDuration / nSyllables;
      const vowels = extractVowels(word.phones?.[0]) ?? [];
      const centroids = word.centroid ?? [];
      const spacing = centroids.length / nSyllables;

      for (let si = 0; si < nSyllables; si++) {
        const start = word.start + si * syllableDuration;
        const { x, y, row } = timeToPixels(start);
        const ci = Math.floor(si * spacing);
        const vertOff = ((centroids[ci] ?? 0.5) * 0.5 - 0.65) * rowHeight;
        const finalY = y + rowHeight / 2 + vertOff;
        const id = `${li}-${wi}-${si}`;

        glyphCoords.set(id, { x, y: finalY });

        const isSelected = selectedIds.includes(id);
        const isMatch = matchedIds.has(id);
        const fill = isSelected
          ? vowelColors[vowels[si] ?? "AH"]
          : isMatch
          ? vowelColors[vowels[si] ?? "AH"]
          : inactiveSyllableColor;

        // -------------------------------
        //  RENDER GLYPH OR CIRCLE
        // -------------------------------
        const commonHandlers = {
          onClick: () => seekAll(start),
          onMouseEnter: (e) =>
            onGlyphHoverEnter(e, {
              wordText: word.text,
              phones: Array.isArray(word.phones)
                ? word.phones.join(" ")
                : String(word.phones),
              vowel: vowels[si] ?? "AH",
              syllableIndex: si,
              totalSyllables: nSyllables,
            }),
          onMouseLeave: onGlyphHoverLeave,
          style: { cursor: "pointer" },
        };

        if (!glyphUrl) {
          // Fallback: original circle
          syllables.push(
            <circle
              key={id}
              cx={x + radius}
              cy={finalY}
              r={radius}
              fill={fill}
              opacity={syllableOpacity}
              stroke={isSelected ? "red" : "none"}
              strokeWidth={isSelected ? 2 : 0}
              {...commonHandlers}
            />
          );
        } else {
          const groupX = x;
          const groupY = finalY - radius;
          const maskId = `syllable-mask-${id}`;

          syllables.push(
            <g
              key={id}
              transform={`translate(${groupX}, ${groupY})`}
              {...commonHandlers}
            >
              {/* Define a mask that uses the SVG glyph image */}
              <defs>
                <mask id={maskId}>
                  <image
                    href={glyphUrl}
                    x={0}
                    y={0}
                    width={diameter}
                    height={diameter}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                </mask>
              </defs>

              {/* Colored shape, clipped to the glyph silhouette */}
              <rect
                x={0}
                y={0}
                width={diameter}
                height={diameter}
                fill={fill}
                opacity={syllableOpacity}
                mask={`url(#${maskId})`}
              />

              {/* Selection outline */}
              {isSelected && (
                <circle
                  cx={radius}
                  cy={radius}
                  r={radius + 1.5}
                  fill="none"
                  stroke="red"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        }
      }
    });
  });

  // === CONNECTORS ===
  const connectors = [];

  // Selected arc (red)
  if (selectedIds.length === 2) {
    const [a, b] = selectedIds;
    const pA = glyphCoords.get(a);
    const pB = glyphCoords.get(b);
    if (pA && pB) {
      const x1 = pA.x + radius;
      const y1 = pA.y;
      const x2 = pB.x + radius;
      const y2 = pB.y;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const curvature = syllableArcCurve ?? 1;
      const radiusArc = curvature === 0 ? 0.01 : distance / (2 * curvature);

      connectors.push(
        <path
          key={`sel-${a}-${b}`}
          d={`M ${x1} ${y1} A ${radiusArc} ${radiusArc} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke="#f00"
          strokeWidth={3}
          strokeDasharray="4 1"
          strokeLinecap="round"
        />
      );
    }
  }

  // Matched arcs (black)
  const matchedSorted = Array.from(matchedIds)
    .filter((id) => idToFlatIndex.has(id))
    .sort((u, v) => idToFlatIndex.get(u) - idToFlatIndex.get(v));

  for (let i = 0; i < matchedSorted.length - 1; i++) {
    const a = matchedSorted[i];
    const b = matchedSorted[i + 1];

    if (
      idToFlatIndex.get(b) === idToFlatIndex.get(a) + 1 &&
      !(selectedIds.includes(a) && selectedIds.includes(b))
    ) {
      const pA = glyphCoords.get(a);
      const pB = glyphCoords.get(b);
      if (pA && pB) {
        const x1 = pA.x + radius;
        const y1 = pA.y;
        const x2 = pB.x + radius;
        const y2 = pB.y;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curvature = syllableArcCurve ?? 1;
        const radiusArc = curvature === 0 ? 0.01 : distance / (2 * curvature);

        connectors.push(
          <path
            key={`match-${a}-${b}`}
            d={`M ${x1} ${y1} A ${radiusArc} ${radiusArc} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke="#000"
            strokeWidth={3}
            strokeDasharray="4 1"
            strokeLinecap="round"
          />
        );
      }
    }
  }

  return (
    <>
      {/* {connectors} */}
      {syllables}
    </>
  );
}
