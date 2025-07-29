// src/components/TapestryView/SyllableGlyphs.jsx
import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useSyllableSelection } from "../../../contexts/lyricsContexts/SyllableSelectionContext";
import { useParams } from "../../../contexts/ParamsContext";
import { extractVowels } from "../../../utils/extractVowels";
import { useAudioEngine } from "../../../contexts/AudioContext";

export default function SyllableGlyphs({
  transcriptionData,
  timeToX,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { matchedIds, selectedIds } = useSyllableSelection();
  const { showSyllables, vowelColors, inactiveSyllableColor, syllableOpacity } =
    useParams();
  const { seekAll } = useAudioEngine();

  if (!layout || !timeToX || !showSyllables) return null;

  const { secondsPerRow, rowHeight } = layout;
  const radius = 8;

  // first, build a flat-ordered list of all syllable IDs
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

  // collect syllable glyphs and remember their coords
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
        const x = timeToX(start) + radius;
        const row = Math.floor(start / secondsPerRow);
        const baseY = row * rowHeight + rowHeight / 2;
        const ci = Math.floor(si * spacing);
        const vertOff = ((centroids[ci] ?? 0.5) * 0.5 - 0.5) * rowHeight;
        const y = baseY + vertOff;
        const id = `${li}-${wi}-${si}`;

        glyphCoords.set(id, { x, y });

        const isSelected = selectedIds.includes(id);
        const isMatch = matchedIds.has(id);
        const fill = isSelected
          ? vowelColors[vowels[si] ?? "AH"]
          : isMatch
          ? vowelColors[vowels[si] ?? "AH"]
          : inactiveSyllableColor;

        syllables.push(
          <circle
            key={id}
            cx={x}
            cy={y}
            r={radius}
            fill={fill}
            opacity={syllableOpacity}
            stroke={isSelected ? "red" : "none"}
            strokeWidth={isSelected ? 2 : 0}
            style={{ cursor: "pointer" }}
            onClick={() => seekAll(start)}
            onMouseEnter={(e) =>
              onGlyphHoverEnter(e, {
                wordText: word.text,
                phones: Array.isArray(word.phones)
                  ? word.phones.join(" ")
                  : String(word.phones),
                vowel: vowels[si] ?? "AH",
                syllableIndex: si,
                totalSyllables: nSyllables,
              })
            }
            onMouseLeave={onGlyphHoverLeave}
          />
        );
      }
    });
  });

  // connector for exactly two selected syllables
  const connectors = [];
  if (selectedIds.length === 2) {
    const [a, b] = selectedIds;
    const pA = glyphCoords.get(a);
    const pB = glyphCoords.get(b);
    if (pA && pB) {
      connectors.push(
        <line
          key={`sel-${a}-${b}`}
          x1={pA.x}
          y1={pA.y}
          x2={pB.x}
          y2={pB.y}
          stroke="#f00"
          strokeWidth={20}
        />
      );
    }
  }

  // connectors for matched pairs (adjacent in flat sequence)
  const matchedSorted = Array.from(matchedIds)
    .filter((id) => idToFlatIndex.has(id))
    .sort((u, v) => idToFlatIndex.get(u) - idToFlatIndex.get(v));

  for (let i = 0; i < matchedSorted.length - 1; i++) {
    const a = matchedSorted[i];
    const b = matchedSorted[i + 1];
    if (idToFlatIndex.get(b) === idToFlatIndex.get(a) + 1) {
      const pA = glyphCoords.get(a);
      const pB = glyphCoords.get(b);
      if (pA && pB) {
        connectors.push(
          <line
            key={`match-${a}-${b}`}
            x1={pA.x}
            y1={pA.y}
            x2={pB.x}
            y2={pB.y}
            stroke="#000"
            strokeWidth={20}
            strokeDasharray="4 1"
          />
        );
      }
    }
  }

  return (
    <>
      {connectors}
      {syllables}
    </>
  );
}
